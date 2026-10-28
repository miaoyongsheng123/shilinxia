# 石林峡徒步计分。选手页面和裁判后台都由这个程序提供。
# 启动：python server.py
# 管理员密码只放在这里，只用英文字母和数字。
ADMIN_PASSWORD = "haibu2026"

import hmac
import json
import re
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "board.json"
LOCK = threading.Lock()
HOST = "0.0.0.0"
PORT = 8080

SLOGAN = "凝心聚力携手共赢"
ORDER = ["发现问题", "分析原因", "制定方案", "执行验证"]
ORDER_CHOICES = ["执行验证", "发现问题", "制定方案", "分析原因"]
GATE_MAX = {"1": 20, "2": 20, "3": 30, "4": 30, "5": 20}
SLOGAN_POINTS = [10, 8, 6, 4, 2]

SECRETS = {
    "1": {"id": "M01", "text": "邀请其他队至少 5 名队友一起说出本组口号。", "proof": "现场视频"},
    "2": {"id": "M02", "text": "在正常交流中让其他队友说出「合作」二字。", "proof": "现场视频"},
    "3": {"id": "M03", "text": "与其他团队队员一起拍摄一张有创意的团队合照。", "proof": "现场照片"},
    "4": {"id": "M04", "text": "邀请平时交流较少的两位同事共同合影。", "proof": "现场照片"},
    "5": {"id": "M05", "text": "组织其他队至少 3 名队友完成一个同步动作。", "proof": "现场照片"},
}

FRAGMENTS = {"1": "凝心", "2": "聚力", "3": "携手", "4": "共赢", "5": "logo"}

QUIZ = [
    {
        "name": "q1",
        "title": "数字密码",
        "prompt": "2、6、12、20、30、？ 下一个数字是多少？",
        "options": [["A", "36"], ["B", "40"], ["C", "42"], ["D", "44"]],
        "answer": "C",
    },
    {
        "name": "q2",
        "title": "队伍排序",
        "prompt": "A 组在 B 组前面，C 组在 A 组后面，B 组在 D 组前面。哪一项一定成立？",
        "options": [
            ["A", "A 组一定是第一名"],
            ["B", "A 组一定排在 D 组前面"],
            ["C", "C 组一定排在 B 组后面"],
            ["D", "D 组一定是最后一名"],
        ],
        "answer": "B",
    },
    {
        "name": "q3",
        "title": "真假情报",
        "prompt": "红箱说密码在蓝箱，蓝箱说密码不在自己这里，金箱说密码不在红箱。三句话只有一句是真的，密码在哪个箱子？",
        "options": [["红箱", "红箱"], ["蓝箱", "蓝箱"], ["金箱", "金箱"]],
        "answer": "红箱",
    },
    {
        "name": "q4",
        "title": "团队密码",
        "prompt": "「凝」在最前，「赢」在最后，「携」在「手」前，「共」在「赢」前。哪个口号顺序正确？",
        "options": [
            ["A", "凝心聚力，携手共赢"],
            ["B", "聚力凝心，共赢携手"],
            ["C", "携手凝心，聚力共赢"],
            ["D", "凝心携手，共赢聚力"],
        ],
        "answer": "A",
    },
]

THEMES_2 = [
    {"id": "poster", "title": "年度最佳电影海报", "text": "现场取一个电影名，例如《海步奇遇记》《山顶合伙人》，摆出海报造型。"},
    {"id": "higher", "title": "站得更高，看得更远", "text": "以飞碟或山景为背景，摆出仰望、指向远方、携手向前。配文：眼里有方向，脚下有力量，前方有希望。"},
    {"id": "edge", "title": "突破边界，探索无限", "text": "把飞碟当作探索未知的象征，全队做出发现新世界、奔赴新目标的动作。配文：敢于探索，勇于突破；不设限，向未来。"},
]
CHECKS_2 = [
    {"name": "checkin", "label": "完成打卡 +5", "points": 5},
    {"name": "allIn", "label": "全队参与 +5", "points": 5},
    {"name": "video", "label": "拍成约 15 秒视频 +10", "points": 10},
]
THEMES_3 = [
    {"id": "meet", "title": "千里相会", "text": "用彩虹桥做背景，拍一张或一段搞笑的相会。可以是穿越、错位、偶像剧或商务会谈。"},
    {"id": "mistake", "title": "彩虹桥上的大型误会", "text": "剧本自己编，拍下来。"},
    {"id": "lastkm", "title": "同事说还有最后一公里", "text": "剧本自己编，拍下来。"},
    {"id": "six", "title": "六种职场人格", "text": "开会时的我、下班前一分钟的我、收到临时任务的我、终于完成项目的我、领导说「简单改一下」的我、周五下午的我。拍成六宫格或短视频。"},
]
CHECKS_3 = [
    {"name": "themeDone", "label": "完成所选主题 +10", "points": 10},
    {"name": "allIn", "label": "团队参与 +10", "points": 10},
    {"name": "creative", "label": "创意表现 +10", "points": 10},
]
SPOTS = [
    {"name": "fu", "title": "好运福地", "text": "不求锦鲤来相助，只求今天有福气。找到名字里带着福气的地方，全队拍一张「今日份福气已到账」。", "points": 7.5},
    {"name": "hu", "title": "山中虎将 · 大虎", "text": "山中有位名字里藏着百兽之王的大人物。找到大虎，摆出最威风的姿势合影。", "points": 7.5},
    {"name": "ao", "title": "忠诚守护者 · 藏獒", "text": "它威风又忠诚，是山中的守护者。找到藏獒，拍一张守护团队的合影。", "points": 7.5},
    {"name": "spring", "title": "山间清泉", "text": "山间有一处名字和水有关的地方。找到清泉，全队拍一张清新的合影。", "points": 7.5},
]
GATE_LIST = [
    {"id": 1, "place": "检票口路", "title": "峡谷密码", "max": 20},
    {"id": 2, "place": "烽火台", "title": "UFO 玻璃步道", "max": 20},
    {"id": 3, "place": "彩虹池", "title": "彩虹池挑战", "max": 30},
    {"id": 4, "place": "沿途", "title": "寻宝", "max": 30},
    {"id": 5, "place": "休息区摇摇椅", "title": "一木千钧", "max": 30},
]
EVENTS = {
    "加入": "加入本组",
    "改选": "改选本组",
    "领取秘密任务": "领取秘密任务",
    "保存秘密任务": "更新秘密任务",
    "提交举报": "提交举报",
    "提交第1关": "提交第 1 关",
    "提交第2关": "提交第 2 关",
    "提交第3关": "提交第 3 关",
    "提交第4关": "提交第 4 关",
    "提交第5关": "提交第 5 关",
}


class ClientError(Exception):
    def __init__(self, message, status=400, extra=None):
        super().__init__(message)
        self.status = status
        self.extra = extra or {}


def now_ms():
    return int(time.time() * 1000)


def r1(value):
    return round(float(value) + 1e-9, 1)


def clip(value, limit):
    return str(value or "").strip()[:limit]


def as_bool(value):
    return value is True


def norm_slogan(value):
    return re.sub(r"[\s,，、。．.！!]", "", str(value or ""))


def slogan_ok(value):
    return norm_slogan(value) == SLOGAN


def option_text(question, value):
    for val, label in question["options"]:
        if val == value:
            return label
    return value or "未选"


def empty_team():
    return {
        "deviceId": "",
        "createdAt": 0,
        "updatedAt": 0,
        "secretClaimed": False,
        "secretDone": False,
        "secretNote": "",
        "reportTeam": "",
        "reportNote": "",
        "reportOk": False,
        "adjust": {},
        "gates": {},
    }


def has_progress(raw):
    if not raw:
        return False
    if raw.get("secretClaimed") or raw.get("secretDone") or raw.get("reportTeam"):
        return True
    return bool(raw.get("gates"))


def clean_team(value):
    team = str(value or "").strip()
    if team not in list("123456"):
        raise ClientError("请选择第 1 组到第 6 组")
    return team


def clean_device(value):
    text = str(value or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,80}", text):
        raise ClientError("这部手机的编号无效，请刷新后再试")
    return text


def prepare(board):
    board.setdefault("teams", {})
    board.setdefault("log", [])
    board.setdefault("devices", {})
    return board


def load_board():
    if not DATA.exists():
        return {"teams": {}, "log": [], "devices": {}}
    return prepare(json.loads(DATA.read_text(encoding="utf-8")))


def save_board(board):
    DATA.parent.mkdir(parents=True, exist_ok=True)
    tmp = DATA.with_suffix(".tmp")
    tmp.write_text(json.dumps(board, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(DATA)


def order_ok(items):
    return items == ORDER


def gate_raw(raw, gid):
    return (raw.get("gates") or {}).get(str(gid)) or {}


def gate_submitted(raw, gid):
    gate = gate_raw(raw, gid)
    if not gate:
        return False
    if gid == 1:
        answers = gate.get("answers") or {}
        return all(answers.get(name) for name in ("q1", "q2", "q3", "q4"))
    if gid == 5:
        return order_ok(gate.get("order") or [])
    return True


def open_gates(raw):
    opened = [1]
    for gid in (1, 2, 3, 4):
        if gate_submitted(raw, gid):
            opened.append(gid + 1)
        else:
            break
    return opened


def quiz_score(gate):
    answers = gate.get("answers") or {}
    return sum(5 for item in QUIZ if answers.get(item["name"]) == item["answer"])


def check_score(gate, checks):
    return sum(item["points"] for item in checks if gate.get(item["name"]) is True)


def spot_score(gate):
    return sum(item["points"] for item in SPOTS if gate.get(item["name"]) is True)


def auto_gate_score(raw, gid):
    gate = gate_raw(raw, gid)
    if not gate:
        return 0
    if gid == 1:
        return quiz_score(gate) if gate_submitted(raw, 1) else 0
    if gid == 2:
        return check_score(gate, CHECKS_2)
    if gid == 3:
        return check_score(gate, CHECKS_3)
    if gid == 4:
        return spot_score(gate)
    if gid == 5:
        return 20 if order_ok(gate.get("order") or []) else 0
    return 0


def picked_score(raw, gid):
    auto = r1(auto_gate_score(raw, gid))
    adjust = raw.get("adjust") or {}
    if str(gid) in adjust:
        return r1(adjust[str(gid)]), auto, True
    return auto, auto, False


def slogan_ranks(board):
    rows = []
    for team, raw in (board.get("teams") or {}).items():
        gate = gate_raw(raw, 5)
        if gate.get("sloganAt") and order_ok(gate.get("order") or []) and slogan_ok(gate.get("slogan")):
            rows.append((gate["sloganAt"], team))
    rows.sort()
    result = {}
    for index, (_at, team) in enumerate(rows):
        result[team] = SLOGAN_POINTS[index] if index < len(SLOGAN_POINTS) else 0
    return result


def score_team(board, team, raw):
    secret = 10 if raw.get("secretDone") and team in SECRETS else 0
    report = 20 if raw.get("reportOk") and raw.get("reportTeam") in SECRETS else 0
    gates = {}
    auto = {}
    overrides = {}
    for gid in (1, 2, 3, 4, 5):
        score, auto_score, overridden = picked_score(raw, gid)
        gates[str(gid)] = score
        auto[str(gid)] = auto_score
        overrides[str(gid)] = overridden
    slogan = slogan_ranks(board).get(team, 0)
    total = r1(secret + report + sum(gates.values()) + slogan)
    return {
        "secret": secret,
        "report": report,
        "gates": gates,
        "auto": auto,
        "override": overrides,
        "slogan": slogan,
        "total": total,
    }


def quiz_items(gate, reveal):
    answers = gate.get("answers") or {}
    items = []
    for question in QUIZ:
        chosen = answers.get(question["name"], "")
        ok = bool(chosen) and chosen == question["answer"]
        item = {
            "name": question["name"],
            "label": question["title"],
            "value": option_text(question, chosen),
            "ok": ok if chosen else None,
            "points": 5 if ok else 0,
        }
        if reveal:
            item["answer"] = option_text(question, question["answer"])
        items.append(item)
    return items


def check_items(gate, rows):
    items = []
    for row in rows:
        on = gate.get(row["name"]) is True
        items.append({
            "name": row["name"],
            "label": row.get("label") or row.get("title"),
            "value": "已勾选" if on else "未勾选",
            "points": row["points"] if on else 0,
        })
    return items


def theme_label(themes, theme_id):
    for theme in themes:
        if theme["id"] == theme_id:
            return theme["title"]
    return theme_id or "未选"


def gate_review(team, raw, ranks, reveal):
    review = {}
    for gid in (1, 2, 3, 4, 5):
        gate = gate_raw(raw, gid)
        submitted = gate_submitted(raw, gid) if gid != 5 else bool(gate)
        if gid == 5:
            submitted = order_ok(gate.get("order") or [])
        score, auto, overridden = picked_score(raw, gid)
        entry = {
            "submitted": submitted if gid != 5 else bool(gate),
            "cleared": order_ok(gate.get("order") or []) if gid == 5 else submitted,
            "auto": auto,
            "score": score,
            "override": overridden,
            "at": gate.get("at") or 0,
            "items": [],
        }
        if gid == 1 and gate:
            entry["items"] = quiz_items(gate, reveal)
            entry["submitted"] = gate_submitted(raw, 1)
        elif gid == 2 and gate:
            entry["items"] = [{"label": "主题", "value": theme_label(THEMES_2, gate.get("theme"))}] + check_items(gate, CHECKS_2)
        elif gid == 3 and gate:
            entry["items"] = [{"label": "主题", "value": theme_label(THEMES_3, gate.get("theme"))}] + check_items(gate, CHECKS_3)
        elif gid == 4 and gate:
            entry["items"] = check_items(gate, SPOTS)
        elif gid == 5:
            if reveal:
                entry["fragment"] = FRAGMENTS.get(team, "")
                entry["fragmentOpen"] = False
            if gate:
                order = gate.get("order") or []
                entry["items"] = [
                    {"label": "第 %s 步" % (index + 1), "value": text or "未选", "ok": text == ORDER[index]}
                    for index, text in enumerate(order)
                ]
                entry["orderOk"] = order_ok(order)
                entry["sloganOk"] = bool(entry["orderOk"] and slogan_ok(gate.get("slogan")))
                entry["slogan"] = gate.get("slogan") or ""
                entry["sloganAt"] = gate.get("sloganAt") or 0
                entry["sloganPoints"] = ranks.get(team, 0)
                entry["submitted"] = entry["orderOk"]
                if reveal:
                    entry["fragmentOpen"] = entry["orderOk"]
                elif entry["orderOk"]:
                    entry["fragment"] = FRAGMENTS.get(team, "")
        review[str(gid)] = entry
    return review


def public_secret(team, raw):
    if team in SECRETS and raw.get("secretClaimed"):
        return dict(SECRETS[team])
    return None


def build_player_view(board, team, raw, message=""):
    ranks = slogan_ranks(board)
    return {
        "team": team,
        "raw": {
            "secretClaimed": bool(raw.get("secretClaimed")),
            "secretDone": bool(raw.get("secretDone")),
            "secretNote": raw.get("secretNote") or "",
            "reportTeam": raw.get("reportTeam") or "",
            "reportNote": raw.get("reportNote") or "",
            "reportOk": bool(raw.get("reportOk")),
            "gates": raw.get("gates") or {},
        },
        "secret": public_secret(team, raw),
        "review": gate_review(team, raw, ranks, False),
        "scores": score_team(board, team, raw),
        "openGates": open_gates(raw),
        "message": message,
    }


def remember(board, team, event, total):
    title = EVENTS.get(event)
    if not title:
        return
    board["log"].insert(0, {"at": now_ms(), "team": team, "event": title, "total": total})
    del board["log"][300:]


def bind_device(board, device, team):
    devices = board["devices"]
    bound = devices.get(device)
    if bound and bound != team:
        old = board["teams"].get(bound) or {}
        if has_progress(old):
            raise ClientError(
                "这部手机已经是第 %s 组。要换组，请让裁判在后台清空。" % bound,
                409,
                {"boundTeam": bound},
            )
        if old.get("deviceId") == device:
            board["teams"].pop(bound, None)
    raw = board["teams"].get(team)
    if raw and raw.get("deviceId") and raw["deviceId"] != device and has_progress(raw):
        raise ClientError("第 %s 组已经在另一部手机上开始了。" % team, 409)
    if raw is None:
        raw = empty_team()
        raw["createdAt"] = now_ms()
        board["teams"][team] = raw
    devices[device] = team
    raw["deviceId"] = device
    return raw


def owned_raw(board, device, team):
    bound = board["devices"].get(device)
    if bound and bound != team:
        raise ClientError(
            "这部手机绑定的是第 %s 组。" % bound,
            409,
            {"boundTeam": bound},
        )
    raw = board["teams"].get(team)
    if raw and raw.get("deviceId") and raw["deviceId"] != device and has_progress(raw):
        raise ClientError("第 %s 组已经在另一部手机上开始了。" % team, 409)
    return raw or empty_team()


def theme_id(value, themes):
    text = str(value or "")
    if any(theme["id"] == text for theme in themes):
        return text
    raise ClientError("请先选一个主题")


def store_gate(raw, gid, incoming):
    prev = gate_raw(raw, gid)
    opened = set(open_gates(raw))
    if gid not in opened:
        raise ClientError("先完成上一关，才能提交这一关")
    stamp = prev.get("at") or now_ms()
    if gid == 1:
        answers = incoming.get("answers") if isinstance(incoming.get("answers"), dict) else {}
        clean = {item["name"]: str(answers.get(item["name"]) or "") for item in QUIZ}
        if not all(clean.values()):
            raise ClientError("四道题都要选")
        stored = {"answers": clean, "at": stamp, "revisedAt": now_ms()}
        message = "第 1 关已提交。"
    elif gid == 2:
        stored = {
            "theme": theme_id(incoming.get("theme"), THEMES_2),
            "checkin": as_bool(incoming.get("checkin")),
            "allIn": as_bool(incoming.get("allIn")),
            "video": as_bool(incoming.get("video")),
            "at": stamp,
            "revisedAt": now_ms(),
        }
        message = "第 2 关已提交。"
    elif gid == 3:
        stored = {
            "theme": theme_id(incoming.get("theme"), THEMES_3),
            "themeDone": as_bool(incoming.get("themeDone")),
            "allIn": as_bool(incoming.get("allIn")),
            "creative": as_bool(incoming.get("creative")),
            "at": stamp,
            "revisedAt": now_ms(),
        }
        message = "第 3 关已提交。投票在群里进行，创意分裁判可以后改。"
    elif gid == 4:
        stored = {
            "fu": as_bool(incoming.get("fu")),
            "hu": as_bool(incoming.get("hu")),
            "ao": as_bool(incoming.get("ao")),
            "spring": as_bool(incoming.get("spring")),
            "at": stamp,
            "revisedAt": now_ms(),
        }
        message = "第 4 关已提交。"
    else:
        order = incoming.get("order")
        if not isinstance(order, list) or len(order) != 4:
            raise ClientError("请把四步都排上")
        order = [str(item or "") for item in order]
        if any(item not in ORDER for item in order):
            raise ClientError("有一步不在任务卡里")
        slogan = clip(incoming.get("slogan"), 20)
        slogan_ready = order_ok(order) and slogan_ok(slogan)
        slogan_at = (prev.get("sloganAt") or now_ms()) if slogan_ready else 0
        stored = {
            "order": order,
            "slogan": slogan,
            "sloganAt": slogan_at,
            "at": stamp,
            "revisedAt": now_ms(),
        }
        if len(set(order)) < 4:
            message = "四步都要选，而且不能重复。"
        elif not order_ok(order):
            message = "顺序还没对上。"
        elif not slogan:
            message = "顺序对了。本组碎片在下面，去和其他组拼八个字。"
        elif not slogan_ok(slogan):
            message = "顺序是对的。口号还没对上。"
        else:
            message = "口号对了。名次分按五组里的提交先后计算。"
    raw.setdefault("gates", {})[str(gid)] = stored
    return message


def sync_team(board, device, team, event, incoming):
    prepare(board)
    incoming = incoming or {}
    raw = bind_device(board, device, team)
    message = ""
    if event in ("加入", "改选"):
        pass
    elif event == "领取秘密任务":
        if team not in SECRETS:
            raise ClientError("第 6 组不领取秘密任务")
        raw["secretClaimed"] = True
    elif event == "保存秘密任务":
        if team not in SECRETS or not raw.get("secretClaimed"):
            raise ClientError("请先领取秘密任务")
        raw["secretDone"] = as_bool(incoming.get("secretDone"))
        raw["secretNote"] = clip(incoming.get("secretNote"), 200)
    elif event == "提交举报":
        report_team = str(incoming.get("reportTeam") or "")
        if report_team not in SECRETS or report_team == team:
            raise ClientError("请选择其他领取了秘密任务的组")
        raw["reportTeam"] = report_team
        raw["reportNote"] = clip(incoming.get("reportNote"), 200)
    elif re.fullmatch(r"提交第([1-5])关", event or ""):
        gid = int(re.fullmatch(r"提交第([1-5])关", event).group(1))
        gate = incoming.get("gate") if isinstance(incoming.get("gate"), dict) else {}
        message = store_gate(raw, gid, gate)
    else:
        raise ClientError("无法识别这次提交")
    raw["updatedAt"] = now_ms()
    view = build_player_view(board, team, raw, message)
    remember(board, team, event, view["scores"]["total"])
    return view


def pull_team(board, device, team):
    prepare(board)
    raw = owned_raw(board, device, team)
    return build_player_view(board, team, raw, "")


def apply_adjust(raw, adjust, report_ok):
    clean = {}
    for gid, max_points in GATE_MAX.items():
        if gid not in adjust:
            continue
        value = adjust[gid]
        if value is None or value == "":
            continue
        try:
            num = float(value)
        except (TypeError, ValueError):
            raise ClientError("第 %s 关的核定分要是数字" % gid)
        if num < 0 or num > max_points:
            raise ClientError("第 %s 关的核定分要在 0 到 %s 之间" % (gid, max_points))
        clean[gid] = r1(num)
    if report_ok and not raw.get("reportTeam"):
        raise ClientError("这一组还没有提交举报")
    raw["adjust"] = clean
    raw["reportOk"] = bool(report_ok) and bool(raw.get("reportTeam"))
    raw["updatedAt"] = now_ms()


def admin_row(board, team, raw, ranks):
    return {
        "team": team,
        "updatedAt": raw.get("updatedAt") or 0,
        "secretClaimed": bool(raw.get("secretClaimed")),
        "secretDone": bool(raw.get("secretDone")),
        "secretNote": raw.get("secretNote") or "",
        "secret": SECRETS.get(team),
        "reportTeam": raw.get("reportTeam") or "",
        "reportNote": raw.get("reportNote") or "",
        "reportOk": bool(raw.get("reportOk")),
        "adjust": raw.get("adjust") or {},
        "scores": score_team(board, team, raw),
        "review": gate_review(team, raw, ranks, True),
    }


def answer_key():
    return {
        "quiz": [{"title": item["title"], "answer": option_text(item, item["answer"])} for item in QUIZ],
        "order": ORDER,
        "slogan": "凝心聚力，携手共赢",
        "fragments": [{"team": team, "text": text} for team, text in FRAGMENTS.items()],
        "secrets": [{"team": team, "id": item["id"], "text": item["text"], "proof": item["proof"]} for team, item in SECRETS.items()],
    }


def admin_board(board):
    prepare(board)
    ranks = slogan_ranks(board)
    rows = []
    for team in list("123456"):
        raw = board["teams"].get(team) or empty_team()
        rows.append(admin_row(board, team, raw, ranks))
    rows.sort(key=lambda row: (-row["scores"]["total"], row["updatedAt"] or 10**15, row["team"]))
    return {"ranking": rows, "log": board.get("log") or [], "key": answer_key()}


def gate_content(board, device, team, gid):
    prepare(board)
    if gid not in (1, 2, 3, 4, 5):
        raise ClientError("没有这一关")
    raw = owned_raw(board, device, team)
    if gid not in open_gates(raw):
        raise ClientError("先完成上一关，才能看这一关", 403)
    if gid == 1:
        return {
            "type": "quiz",
            "intro": "检票口路。四题各 5 分，提交后立刻出分。",
            "questions": [
                {"name": item["name"], "title": item["title"], "prompt": item["prompt"], "options": item["options"]}
                for item in QUIZ
            ],
        }
    if gid == 2:
        return {
            "type": "theme",
            "intro": "烽火台，UFO 玻璃步道。三个主题选一个，拍照或拍约 15 秒视频，发到队伍群。",
            "themes": THEMES_2,
            "checks": CHECKS_2,
        }
    if gid == 3:
        return {
            "type": "theme",
            "intro": "彩虹池。四个主题选一个。作品发到群里后，每队出一名投票人，不能投本队，票高者胜；平票就重投。",
            "themes": THEMES_3,
            "checks": CHECKS_3,
        }
    if gid == 4:
        return {
            "type": "spots",
            "intro": "沿途不用设工作人员。四项各 7.5 分，找到标志后全队合影，发到队伍群。",
            "spots": SPOTS,
        }
    return {
        "type": "order",
        "intro": "休息区摇摇椅。先把四步排对，得 20 分，然后才看得到本组口号碎片。五组拼出八个字后提交，按先后得 10、8、6、4、2 分。",
        "steps": ORDER_CHOICES,
    }


def public_meta():
    return {"gates": GATE_LIST, "base": public_base()}


def public_base():
    return "http://%s:%s/" % (lan_ip(), PORT)


def lan_ip():
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def check_password(password):
    got = str(password or "").encode("utf-8")
    if not hmac.compare_digest(got, ADMIN_PASSWORD.encode("utf-8")):
        time.sleep(0.35)
        raise ClientError("密码不对", 401)


def read_context(data):
    return clean_device(data.get("deviceId")), clean_team(data.get("team"))


def with_board(mutator):
    with LOCK:
        board = load_board()
        result = mutator(board)
        save_board(board)
        return result


def read_board(reader):
    with LOCK:
        return reader(load_board())


class Server(ThreadingHTTPServer):
    allow_reuse_address = True


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_GET(self):
        path = route_path(self.path)
        try:
            if path == "/api/health":
                return self.send_json(200, {"ok": True, "base": public_base()})
            if path == "/api/meta":
                return self.send_json(200, public_meta())
            if path.startswith("/api/"):
                return self.send_json(404, {"error": "没有这个接口"})
            self.serve_static(path)
        except ClientError as err:
            self.send_error_body(err)
        except Exception:
            traceback.print_exc()
            self.send_json(500, {"error": "服务器出错了"})

    def do_POST(self):
        path = route_path(self.path)
        try:
            data = self.read_json()
            if path == "/api/pull":
                device, team = read_context(data)
                return self.send_json(200, read_board(lambda board: pull_team(board, device, team)))
            if path == "/api/sync":
                device, team = read_context(data)
                event = str(data.get("event") or "")
                incoming = data.get("state") if isinstance(data.get("state"), dict) else {}
                return self.send_json(200, with_board(lambda board: sync_team(board, device, team, event, incoming)))
            if path == "/api/gate-content":
                device, team = read_context(data)
                try:
                    gid = int(data.get("gate"))
                except (TypeError, ValueError):
                    raise ClientError("没有这一关")
                return self.send_json(200, read_board(lambda board: gate_content(board, device, team, gid)))
            if path == "/api/admin/board":
                check_password(data.get("password"))
                return self.send_json(200, read_board(admin_board))
            if path == "/api/admin/adjust":
                check_password(data.get("password"))
                team = clean_team(data.get("team"))
                adjust = data.get("adjust") if isinstance(data.get("adjust"), dict) else {}
                report_ok = as_bool(data.get("reportOk"))

                def mutate(board):
                    prepare(board)
                    raw = board["teams"].get(team)
                    if raw is None:
                        raise ClientError("这一组还没有人加入")
                    apply_adjust(raw, adjust, report_ok)
                    board["log"].insert(0, {"at": now_ms(), "team": team, "event": "裁判核定", "total": score_team(board, team, raw)["total"]})
                    del board["log"][300:]
                    return admin_board(board)

                return self.send_json(200, with_board(mutate))
            if path == "/api/admin/reset":
                check_password(data.get("password"))
                team = clean_team(data.get("team"))

                def mutate(board):
                    prepare(board)
                    board["teams"].pop(team, None)
                    board["devices"] = {key: value for key, value in board["devices"].items() if value != team}
                    board["log"].insert(0, {"at": now_ms(), "team": team, "event": "裁判清空", "total": 0})
                    del board["log"][300:]
                    return admin_board(board)

                return self.send_json(200, with_board(mutate))
            self.send_json(404, {"error": "没有这个接口"})
        except ClientError as err:
            self.send_error_body(err)
        except Exception:
            traceback.print_exc()
            self.send_json(500, {"error": "服务器出错了"})

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > 200000:
            raise ClientError("提交的内容太大")
        raw = self.rfile.read(length) if length else b""
        if not raw:
            return {}
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            raise ClientError("提交的内容不是有效数据")
        if not isinstance(data, dict):
            raise ClientError("提交的内容不是有效数据")
        return data

    def send_error_body(self, err):
        body = {"error": str(err)}
        body.update(err.extra or {})
        self.send_json(err.status, body)

    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionAbortedError):
            pass

    def serve_static(self, url_path):
        rel = unquote(url_path).lstrip("/") or "index.html"
        if rel.startswith("data/") or ".." in rel.split("/"):
            self.send_error(404)
            return
        candidate = (ROOT / rel).resolve()
        if ROOT != candidate and ROOT not in candidate.parents:
            self.send_error(404)
            return
        if not candidate.is_file():
            self.send_error(404)
            return
        data = candidate.read_bytes()
        kind = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".png": "image/png",
            ".svg": "image/svg+xml",
        }.get(candidate.suffix.lower(), "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionAbortedError):
            pass


def route_path(raw):
    path = unquote(urlparse(raw).path)
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    return path


def self_check():
    board = {"teams": {}, "log": [], "devices": {}}
    view = sync_team(board, "device0001", "1", "加入", {})
    assert view["openGates"] == [1]
    assert view["secret"] is None
    answers = {"q1": "C", "q2": "B", "q3": "红箱", "q4": "A"}
    view = sync_team(board, "device0001", "1", "提交第1关", {"gate": {"answers": answers}})
    assert view["scores"]["gates"]["1"] == 20
    assert 2 in view["openGates"]
    for item in view["review"]["1"]["items"]:
        assert "answer" not in item
    try:
        sync_team(board, "device0001", "1", "提交第3关", {"gate": {"theme": "meet", "themeDone": True, "allIn": True, "creative": True}})
        raise SystemExit("第 3 关不该在第 2 关前提交")
    except ClientError:
        pass
    assert "3" not in board["teams"]["1"]["gates"]
    try:
        gate_content(board, "device0001", "1", 3)
        raise SystemExit("第 3 关正文不该提前打开")
    except ClientError:
        pass
    assert gate_content(board, "device0001", "1", 2)["type"] == "theme"
    view = sync_team(board, "device0001", "1", "领取秘密任务", {})
    assert view["secret"]["id"] == "M01"
    view = sync_team(board, "device0001", "1", "保存秘密任务", {"secretDone": True, "secretNote": "已拍", "reportOk": True})
    assert view["scores"]["secret"] == 10
    assert view["scores"]["report"] == 0
    assert board["teams"]["1"]["reportOk"] is False
    try:
        sync_team(board, "device0001", "2", "加入", {})
        raise SystemExit("有进度的手机不该换组")
    except ClientError:
        pass
    try:
        sync_team(board, "device0006", "6", "领取秘密任务", {})
        raise SystemExit("第 6 组不该领到秘密任务")
    except ClientError:
        pass
    sync_team(board, "device0006", "6", "加入", {})
    for gid, payload in (
        (1, {"answers": answers}),
        (2, {"theme": "poster", "checkin": True, "allIn": True, "video": True}),
        (3, {"theme": "six", "themeDone": True, "allIn": True, "creative": True}),
        (4, {"fu": True, "hu": True, "ao": True, "spring": True}),
    ):
        sync_team(board, "device0006", "6", "提交第%s关" % gid, {"gate": payload})
    early = {"order": ORDER[:], "slogan": ""}
    view = sync_team(board, "device0006", "6", "提交第5关", {"gate": early})
    assert view["review"]["5"]["fragment"] == ""
    assert view["scores"]["gates"]["4"] == 30
    later = {"order": ORDER[:], "slogan": "凝心聚力，携手共赢"}
    sync_team(board, "device0001", "1", "提交第2关", {"gate": {"theme": "higher", "checkin": True, "allIn": False, "video": False}})
    sync_team(board, "device0001", "1", "提交第3关", {"gate": {"theme": "meet", "themeDone": True, "allIn": False, "creative": False}})
    sync_team(board, "device0001", "1", "提交第4关", {"gate": {"fu": True, "hu": False, "ao": False, "spring": False}})
    sync_team(board, "device0001", "1", "提交第5关", {"gate": {"order": ["执行验证", "发现问题", "制定方案", "分析原因"], "slogan": ""}})
    assert board["teams"]["1"]["gates"]["5"]["sloganAt"] == 0
    view = sync_team(board, "device0001", "1", "提交第5关", {"gate": later})
    assert view["review"]["5"]["fragment"] == "凝心"
    view = sync_team(board, "device0006", "6", "提交第5关", {"gate": later})
    assert view["scores"]["slogan"] == 8
    assert score_team(board, "1", board["teams"]["1"])["slogan"] == 10
    apply_adjust(board["teams"]["1"], {"2": 20, "5": ""}, False)
    assert score_team(board, "1", board["teams"]["1"])["gates"]["2"] == 20
    assert norm_slogan("凝心聚力,携手共赢") == SLOGAN
    def walk(node):
        if isinstance(node, dict):
            assert "answer" not in node
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)
    walk(build_player_view(board, "1", board["teams"]["1"]))
    print("self_check ok")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    except Exception:
        pass
    self_check()
    server = Server((HOST, PORT), Handler)
    base = public_base()
    print("选手首页  " + base, flush=True)
    print("裁判后台  " + base + "#/admin", flush=True)
    print("管理员密码  " + ADMIN_PASSWORD, flush=True)
    print("按 Ctrl+C 停止", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        server.server_close()


if __name__ == "__main__":
    main()
