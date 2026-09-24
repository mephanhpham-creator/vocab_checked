"""Builds design/mockups/index.html: one self-contained page with the
component sheet and every screen/state frame, rendered as plain HTML + CSS.

Content comes from data/*.json (the app's real data), so mockups never drift
from what the app will actually show. Run: python3 design/mockups/build.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).parent / 'src'
OUT = Path(__file__).parent / 'index.html'

topics = json.loads((ROOT / 'data/topics.json').read_text())
passages = json.loads((ROOT / 'data/passages.json').read_text())
ipa = json.loads((ROOT / 'data/ipa.json').read_text())
T = {t['key']: t for t in topics}
e = html.escape

# ---------- icons ----------
SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>'
MIC_OFF = MIC.replace('</svg>', '<path d="M3 3l18 18"/></svg>')


def speak_btn(playing=False):
    return f'<button class="btn-icon{" is-playing" if playing else ""}" data-ui="speak" aria-label="Nghe phát âm">{SPEAKER}</button>'


def slow_btn():
    return '<button class="btn-icon" data-ui="speak-slow" aria-label="Nghe chậm">🐌</button>'


def mic_btn(state='idle', small=False):
    cls = 'btn-mic' + (' is-sm' if small else '') + (' is-listening' if state == 'listening' else '')
    if state == 'disabled':
        return f'<button class="{cls}" data-ui="mic" aria-disabled="true" aria-label="Trình duyệt không hỗ trợ micro">{MIC_OFF}</button>'
    label = 'Đang nghe, bấm để dừng' if state == 'listening' else 'Bấm để nói'
    pressed = ' aria-pressed="true"' if state == 'listening' else ''
    return f'<button class="{cls}" data-ui="mic" aria-label="{label}"{pressed}>{MIC}</button>'


def result(kind, text):
    icon = {'correct': '✅', 'wrong': '❌', 'empty': '🤔'}[kind]
    return f'<div class="result is-{kind}" data-ui="check-result" role="status"><span aria-hidden="true">{icon}</span><span>{text}</span></div>'


def frame(label, sub, body, sheet=False):
    return (f'<div class="frame-wrap"><div class="frame-label">{label} <span>{sub}</span></div>'
            f'<div class="frame{" is-sheet" if sheet else ""}">{body}</div></div>')


def group(gid, title, note, frames):
    return f'<section class="screen-group" id="{gid}"><h2>{title}</h2><p class="note">{note}</p><div class="frames">{"".join(frames)}</div></section>'


# ---------- S1 Home ----------
TABS = [('flashcards', '📚 Flashcard'), ('read', '📖 Luyện đọc'), ('ipa', '🔤 Phát âm IPA')]
HINTS = {
    'flashcards': 'Chọn chủ đề để học từ vựng qua thẻ nhớ hai mặt và luyện phát âm',
    'read': 'Luyện đọc đoạn văn và chấm phát âm theo thời gian thực',
    'ipa': 'Chạm vào một âm để nghe ví dụ và tự nói thử',
}


def topic_card(t, tab, pct):
    if tab == 'read':
        count, label = f'{len(passages[t["key"]]["sentences"])} câu', f'{pct}%'
    else:
        n = len(t['deck'])
        count, label = f'{n} từ', f'{round(n * pct / 100)}/{n}'
    return f'''<button class="topic-card" data-ui="topic-card" data-topic="{t['key']}" style="--topic-accent:{t['accent']}">
  <div><div class="topic-icon" data-ui="topic-icon">{t['icon']}</div><div class="topic-title" data-ui="topic-title">{e(t['title'])}</div><div class="topic-sub" data-ui="topic-subtitle">{e(t['subtitle'])}</div></div>
  <div class="topic-foot"><div class="topic-meta"><span data-ui="topic-count">{count}</span><span data-ui="topic-progress-label">{label}</span></div>
  <div class="progress-track" role="progressbar" aria-valuenow="{pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" data-ui="topic-progress-bar" style="width:{pct}%"></div></div></div>
</button>'''


def home(tab, pcts, body_override=None):
    tabs = ''.join(f'<button class="chip" role="tab" aria-selected="{str(k == tab).lower()}" data-ui="tab" data-tab="{k}">{e(l)}</button>' for k, l in TABS)
    body = body_override or f'<div class="topic-grid is-app" data-ui="topic-grid">{"".join(topic_card(t, tab, p) for t, p in zip(topics, pcts))}</div>'
    return f'''<div class="app">
  <h1 class="app-title">🎓 IELTS Vocab &amp; Speaking</h1>
  <div class="tabs is-main" role="tablist">{tabs}</div>
  <p class="tab-hint" data-ui="tab-hint">{HINTS[tab]}</p>
  {body}
  <p class="storage-note" data-ui="storage-note">💾 Tiến độ được lưu tự động trên trình duyệt này. Đổi trình duyệt hoặc thiết bị thì tiến độ không đi theo.<br>🎤 Luyện nói dùng được trên Chrome, Edge, Safari (cần mạng và quyền micro).</p>
</div>'''


# ---------- S4 IPA ----------
def ipa_groups():
    out = []
    for g in ipa['groups']:
        tiles = ''.join(f'<button class="phoneme-tile" data-ui="phoneme-tile" data-p="{e(it["p"])}"><span class="sym">{e(it["p"])}</span><span class="key">{e(it["ex"][0][0])}</span></button>' for it in g['items'])
        out.append(f'<div class="ipa-group" data-ui="ipa-group"><h3 class="section-title">{e(g["title"])} <small>· {len(g["items"])} âm</small></h3><div class="ipa-grid">{tiles}</div></div>')
    return ''.join(out)


def ipa_pairs():
    tiles = ''.join(f'<button class="pair-tile" data-ui="pair-tile"><span class="sym">{e(p["contrast"])}</span><span class="key">{e(p["pairs"][0][0][0])} / {e(p["pairs"][0][1][0])}</span></button>' for p in ipa['pairs'])
    return f'<div class="ipa-group"><h3 class="section-title">Cặp âm dễ nhầm <small>· {len(ipa["pairs"])} cặp</small></h3><div class="pair-grid">{tiles}</div></div>'


# ---------- S3 Read aloud ----------
def parse(src):
    """{shown|deck} markup -> [(word, is_vocab)], split on whitespace (same as js/match.js)."""
    chars, last = [], 0
    for m in re.finditer(r'\{([^}|]+)(?:\|([^}]+))?\}', src):
        chars += [(c, False) for c in src[last:m.start()]] + [(c, True) for c in m.group(1)]
        last = m.end()
    chars += [(c, False) for c in src[last:]]
    words, cur = [], None
    for c, v in chars:
        if c.isspace():
            cur = None
            continue
        if cur is None:
            cur = ['', False]
            words.append(cur)
        cur[0] += c
        cur[1] = cur[1] or v
    return words


READ_TOPIC = T['appearance']
READ = passages['appearance']
CUR = 3  # "He is almost bald now, ..." is sentence 4


def passage_html(marks=None):
    out = []
    for i, src in enumerate(READ['sentences']):
        words = []
        for wi, (w, vocab) in enumerate(parse(src)):
            cls = ['word'] + (['is-vocab'] if vocab else [])
            if i == CUR and marks is not None:
                cls.append('is-bad' if wi in marks else 'is-ok')
            words.append(f'<span class="{" ".join(cls)}" data-ui="word">{e(w)}</span>')
        out.append(f'<span class="sentence{" is-current" if i == CUR else ""}" data-ui="sentence" data-i="{i}">{" ".join(words)}</span>')
    return ' '.join(out)


def read_screen(state):
    t = READ_TOPIC
    mic_state = {'listening': 'listening', 'unsupported': 'disabled'}.get(state, 'idle')
    marks = {'after': {3}, 'perfect': set()}.get(state)
    best = {'after': '92%', 'perfect': '100%'}.get(state, '86%')
    heard = {
        'idle': '<p class="quiz-hint">Bấm 🎤 rồi đọc to câu đang được tô sáng.</p>',
        'listening': '<div class="heard-live"><span class="live-dot" aria-hidden="true"></span>🎙️ he is almost bold now and the…</div>',
        'after': result('wrong', 'Máy nghe được: “he is almost bold now and the little hair he has left has gone grey” · <b>92%</b>. Từ gạch sóng là từ máy chưa nghe ra.'),
        'perfect': result('correct', '<b>Tuyệt vời!</b> Máy nghe đúng cả câu · <b>100%</b>'),
        'nothing': result('empty', '<b>Chưa nghe rõ.</b> Thử nói to và rõ hơn, rồi bấm 🎤 lại.'),
        'unsupported': '<p class="quiz-hint">Bạn vẫn có thể nghe câu mẫu bằng 🔊 và 🐌.</p>',
        'denied': '<p class="quiz-hint">Cho phép micro xong, bấm 🎤 để thử lại.</p>',
    }[state]
    live = ' is-live' if state == 'listening' else ''
    notice = ''
    if state == 'unsupported':
        notice = '<div class="notice is-warn" data-ui="notice" role="alert"><span aria-hidden="true">⚠️</span><span>Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy mở trang bằng <b>Chrome</b>, <b>Edge</b> hoặc <b>Safari</b> để luyện nói.</span></div>'
    if state == 'denied':
        notice = '<div class="notice is-error" data-ui="notice" role="alert"><span aria-hidden="true">🎙️</span><span><b>Chưa có quyền dùng micro.</b> Chạm biểu tượng 🔒 cạnh địa chỉ web → Micro → Cho phép, rồi thử lại.</span></div>'
    return f'''<div class="app themed" style="--topic-accent:{t['accent']}">
  <div class="topbar"><button class="btn-back" data-ui="back">← Danh sách chủ đề</button><span class="topic-name" data-ui="topic-name">{e(t['title'])}</span></div>
  {notice}
  <h2 class="passage-title" data-ui="passage-title">{e(READ['title'])}</h2>
  <p class="read-hint">Chạm từ <b>in đậm</b> để xem nghĩa · chạm câu khác để chuyển câu</p>
  <div class="passage" data-ui="passage">{passage_html(marks)}</div>
  <div class="status" data-ui="status">Câu {CUR + 1} / {len(READ['sentences'])} · Tốt nhất: <b>{best}</b></div>
  <div class="reader-controls">
    <button class="btn-nav" data-ui="prev" aria-label="Câu trước">←</button>
    {speak_btn()}
    {mic_btn(mic_state)}
    {slow_btn()}
    <button class="btn-nav" data-ui="next" aria-label="Câu tiếp">→</button>
  </div>
  <div class="heard{live}" data-ui="heard">{heard}</div>
  <div class="stats is-two">
    <div class="stat"><div class="stat-num" data-ui="stat-read">5/8</div><div class="stat-lbl">Câu đã đọc</div></div>
    <div class="stat"><div class="stat-num" data-ui="stat-avg">72%</div><div class="stat-lbl">Điểm tốt nhất TB</div></div>
  </div>
</div>'''


# ---------- Sheets ----------
def sheet(body, short=False, under='Nội dung màn hình phía sau…'):
    return (f'<div class="sheet-under">{under}</div><div class="backdrop"></div>'
            f'<div class="sheet{" is-short" if short else ""}" role="dialog" aria-modal="true" data-ui="sheet">'
            f'<div class="sheet-handle" aria-hidden="true"></div><button class="sheet-close" data-ui="sheet-close" aria-label="Đóng">✕</button>{body}</div>')


def practice_row(word, ipa_txt, state='idle', heard=''):
    res = ''
    if state == 'correct':
        res = result('correct', f'<b>Chính xác</b>. Máy nghe được: “{e(heard or word)}”')
    elif state == 'wrong':
        res = result('wrong', f'<b>Máy nghe thành:</b> “{e(heard)}”')
    elif state == 'listening':
        res = '<div class="heard is-live" style="grid-column:1/-1;min-height:0"><span class="live-dot" aria-hidden="true"></span><span style="font-size:13px">Đang nghe… nói “' + e(word) + '”</span></div>'
    return (f'<div class="practice-row" data-ui="practice-row"><div><span class="w" data-ui="word">{e(word)}</span><span class="ipa" data-ui="ipa">{e(ipa_txt)}</span></div>'
            f'<div class="row-btns">{speak_btn()}{mic_btn("listening" if state == "listening" else "idle", small=True)}</div>{res}</div>')


def deck_word(w):
    for t in topics:
        for c in t['deck']:
            if c['word'] == w:
                return c
    raise KeyError(w)


THETA = next(it for g in ipa['groups'] for it in g['items'] if it['p'] == 'θ')
MINE = [deck_word(w) for w in ('thin-faced', 'sympathetic', 'telepathy')]


def s5(states):
    rows = [(w, i) for w, i in THETA['ex']]
    ex = ''.join(practice_row(w, i, states.get(w, 'idle'), {'bath': 'bat', 'think': 'think'}.get(w, '')) for w, i in rows)
    mine = ''.join(practice_row(c['word'], c['ipa']) for c in MINE)
    return sheet(f'''<div class="sheet-head"><div class="sheet-phoneme" data-ui="phoneme">/θ/</div>
<p class="sheet-tip" data-ui="tip">{e(THETA['tip'])}</p></div>
<h4>Ví dụ</h4>{ex}<h4>Từ trong kho của bạn</h4>{mine}''', under='🔤 Phát âm IPA · Nguyên âm đơn · Nguyên âm đôi · Phụ âm…')


PAIR = next(p for p in ipa['pairs'] if p['contrast'] == 'θ – s')


def s6(state):
    a, b = PAIR['pairs'][0]
    if state == 'before':
        choices = f'<button class="quiz-choice" data-ui="quiz-choice" disabled>?</button><button class="quiz-choice" data-ui="quiz-choice" disabled>?</button>'
        tail = '<p class="quiz-hint" data-ui="quiz-result">Bấm “Phát một từ”, nghe kỹ rồi chọn từ bạn nghe được.</p>'
        replay = ''
    else:
        ca = ' is-correct' if state in ('correct', 'wrong') else ''
        cb = ' is-wrong' if state == 'wrong' else ''
        choices = (f'<button class="quiz-choice{ca}" data-ui="quiz-choice">{"✓ " if ca else ""}{a[0]}</button>'
                   f'<button class="quiz-choice{cb}" data-ui="quiz-choice">{"✗ " if cb else ""}{b[0]}</button>')
        replay = f'<button class="btn-icon" data-ui="quiz-replay" aria-label="Nghe lại">🔁</button>'
        tail = {
            'waiting': '<p class="quiz-hint" data-ui="quiz-result">Bạn nghe thấy từ nào?</p>',
            'correct': '<div data-ui="quiz-result">' + result('correct', f'<b>Chính xác</b> — đó là “{a[0]}” <span class="ipa" style="font-size:15px">{a[1]}</span>') + '</div>',
            'wrong': '<div data-ui="quiz-result">' + result('wrong', f'<b>Chưa đúng</b> — máy đã phát “{a[0]}” <span class="ipa" style="font-size:15px">{a[1]}</span>, bạn chọn “{b[0]}”. Nghe lại để so sánh.') + '</div>',
        }[state]
    blocks = ''.join(f'<div class="pair-block" data-ui="pair-block">{practice_row(x[0], x[1])}<div class="pair-vs">vs</div>{practice_row(y[0], y[1])}</div>' for x, y in PAIR['pairs'])
    return sheet(f'''<div class="sheet-head"><div class="sheet-phoneme" style="font-size:32px" data-ui="contrast">/θ/ – /s/</div>
<p class="sheet-tip" data-ui="note">{e(PAIR['note'])}</p></div>
<h4>🎧 Nghe &amp; chọn</h4>
<div class="quiz"><button class="btn-primary" data-ui="quiz-play">▶️ Phát một từ</button>
<div class="quiz-choices">{choices}{replay}</div>{tail}</div>
<h4>🎤 Tự nói từng từ</h4>{blocks}''', under='🔤 Phát âm IPA · Cặp âm dễ nhầm…')


def s7():
    c = deck_word('bald')
    return sheet(f'''<div class="sheet-head"><div class="sheet-word" data-ui="word">{e(c['word'])}</div>
<div class="ipa sheet-center" data-ui="ipa">{e(c['ipa'])}</div></div>
<div class="sheet-center"><div class="sheet-vi" data-ui="meaning-vi">{e(c['vi'])}</div><p class="sheet-en" data-ui="meaning-en">{e(c['en'])}</p></div>
<p class="sheet-example" data-ui="example">“{e(c['ex'])}”</p>
<div class="sheet-actions">{speak_btn()}{slow_btn()}</div>''', short=True, under=passage_html())


# ---------- Page ----------
mixed = [40, 0, 100, 50, 22, 60, 20, 77]
components = (SRC / 'components.html').read_text()
groups = [
    group('components', 'Components', 'Mọi component dùng chung và các trạng thái.', [f'<div style="width:100%">{components}</div>']),
    group('s1', 'S1 · Trang chủ', '3 tab dùng chung một khung. Tab IPA hiển thị S4.', [
        frame('1. Tab Flashcard', '· tiến độ 0%, 40%, 100%…', home('flashcards', mixed)),
        frame('2. Tab Luyện đọc', '· điểm tốt nhất trung bình', home('read', [64, 0, 100, 38, 0, 86, 12, 50])),
        frame('3. Tab Phát âm IPA', '· hiển thị S4', home('ipa', [], ipa_groups())),
        frame('4. Lần đầu mở app', '· mọi chủ đề 0%', home('flashcards', [0] * 8)),
    ]),
    group('s3', 'S3 · Luyện đọc', 'Câu đang đọc được tô nền. Nút mic 64px ở giữa hàng điều khiển, trong vùng ngón cái. Từ đúng: xanh + gạch thẳng; từ sót: đỏ + gạch sóng + đậm.', [
        frame('1. Trước khi đọc', '', read_screen('idle')),
        frame('2. Đang nghe', '· chữ hiện dần', read_screen('listening')),
        frame('3. Sau khi đọc', '· 92%, “bald” bị sót', read_screen('after')),
        frame('4. Đọc hoàn hảo', '· 100%', read_screen('perfect')),
        frame('5. Không nghe thấy gì', '', read_screen('nothing')),
        frame('6. Trình duyệt không hỗ trợ', '', read_screen('unsupported')),
        frame('7. Chưa cấp quyền micro', '', read_screen('denied')),
    ]),
    group('s4', 'S4 · Bảng IPA', '44 âm chia 3 nhóm và 17 cặp âm dễ nhầm. Ký hiệu IPA dùng Noto Sans (đã kiểm tra đủ ký tự).', [
        frame('1. Ba nhóm âm', '', f'<div class="app">{ipa_groups()}</div>'),
        frame('2. Cặp âm dễ nhầm', '· phần cuối trang', f'<div class="app">{ipa_pairs()}</div>'),
    ]),
    group('s5', 'S5 · Chi tiết một âm', 'Bottom sheet cao ~85%.', [
        frame('1. Mặc định', '', s5({}), sheet=True),
        frame('2. Một dòng đang nghe', '· “three”', s5({'three': 'listening'}), sheet=True),
        frame('3. Một dòng đúng', '· “think”', s5({'think': 'correct'}), sheet=True),
        frame('4. Một dòng sai', '· “bath” → “bat”', s5({'bath': 'wrong'}), sheet=True),
    ]),
    group('s6', 'S6 · Cặp âm dễ nhầm', 'Nghe & chọn, rồi tự nói từng từ.', [
        frame('1. Trước khi phát', '', s6('before'), sheet=True),
        frame('2. Chờ chọn', '', s6('waiting'), sheet=True),
        frame('3. Chọn đúng', '', s6('correct'), sheet=True),
        frame('4. Chọn sai', '', s6('wrong'), sheet=True),
    ]),
    group('s7', 'S7 · Nghĩa của từ', 'Mở khi chạm từ in đậm trong S3.', [
        frame('1. Mặc định', '', s7(), sheet=True),
    ]),
]
nav = ''.join(f'<a class="chip" href="#{g}">{n}</a>' for g, n in [('components', 'Components'), ('s1', 'S1'), ('s3', 'S3'), ('s4', 'S4'), ('s5', 'S5'), ('s6', 'S6'), ('s7', 'S7')])
page = f'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fresh Sorbet Mockups</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
{(SRC / 'styles.css').read_text()}</style>
</head>
<body>
<div class="page board">
<header class="page-head"><h1>Fresh Sorbet · Mockups</h1>
<p>Sinh tự động từ <code>design/mockups/build.py</code> với dữ liệu thật trong <code>data/</code>. Mỗi khung rộng 390px (điện thoại).</p></header>
<nav class="board-nav">{nav}</nav>
{"".join(groups)}
</div>
</body>
</html>
'''
OUT.write_text(page)
print('wrote', OUT.relative_to(ROOT), f'{len(page) // 1024} KB')
