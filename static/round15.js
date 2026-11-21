/* 电子继承 · 第十五批增量（叠在 round14…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const TODO_DONE_KEY = "einherit_today_todos_done";
  const LARGE_KEY = "einherit_large_text";
  const NOTE_FOLD_LEN = 64;
  const HIST_PREVIEW = 5;

  let _lgBeneOnly = false;
  let _histExpanded = false;
  let _reviewCalSelected = "";
  let _medIntentQ = "";

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round15SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = msg;
    el.appendChild(text);
    (actions || []).forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = a.label;
      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof a.onClick === "function") a.onClick();
      };
      el.appendChild(btn);
    });
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 8000);
    return el;
  }

  function todayIso() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function loadTodoDone() {
    try {
      const raw = JSON.parse(localStorage.getItem(TODO_DONE_KEY) || "{}");
      if (raw && raw.date === todayIso() && raw.done && typeof raw.done === "object") {
        return raw.done;
      }
    } catch (_) {}
    return {};
  }

  function saveTodoDone(done) {
    localStorage.setItem(
      TODO_DONE_KEY,
      JSON.stringify({ date: todayIso(), done: done || {} })
    );
  }

  /* 1 · 首页今日待办可勾消 */
  async function paintTodayTodos() {
    const list = $("#todayTodosList");
    if (!list) return;
    try {
      const data = await api("/api/today");
      const items = data.items || [];
      const localDone = loadTodoDone();
      if (!items.length) {
        list.innerHTML = "<p class='muted'>今天暂无特别事项，按自己的节奏即可。</p>";
        return;
      }
      list.innerHTML = items
        .map((it) => {
          const key = String(it.key || "");
          const checked = !!localDone[key];
          const serverDone = !!it.done;
          const mark = checked || serverDone;
          return `<div class="todo-item ${mark ? "done" : ""}" data-todo-key="${esc(key)}">
            <label class="todo-check" title="本机勾消，刷新仍保留">
              <input type="checkbox" data-todo-check="${esc(key)}" ${checked ? "checked" : ""}/>
            </label>
            <button type="button" class="todo-go" data-go="${esc(it.go || "home")}">
              <span class="todo-mark">${mark ? "已安顿" : "待办"}</span>
              <span class="todo-body">
                <strong>${esc(it.title || "")}</strong>
                <span class="muted">${esc(it.detail || "")}</span>
              </span>
              <span class="todo-arrow" aria-hidden="true">→</span>
            </button>
          </div>`;
        })
        .join("");
      $$("#todayTodosList [data-todo-check]").forEach((box) => {
        box.onchange = (e) => {
          e.stopPropagation();
          const key = box.dataset.todoCheck || "";
          const done = loadTodoDone();
          if (box.checked) done[key] = true;
          else delete done[key];
          saveTodoDone(done);
          const row = box.closest(".todo-item");
          if (row) {
            row.classList.toggle("done", box.checked);
            const mark = row.querySelector(".todo-mark");
            if (mark) mark.textContent = box.checked ? "已安顿" : "待办";
          }
          toast(box.checked ? "已勾消，本机记住了" : "已取消勾消");
        };
      });
      $$("#todayTodosList .todo-go").forEach((btn) => {
        btn.onclick = (e) => {
          if (e.target.closest("input")) return;
          const go = btn.dataset.go || "home";
          if (typeof show === "function") show(go);
        };
      });
    } catch (e) {
      list.innerHTML = `<p class="muted">待办暂不可用：${esc(e.message)}</p>`;
    }
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await paintTodayTodos();
  };

  /* 2 · 交割缺接收人汇总条 */
  async function paintMissingBeneBar() {
    const list = $("#lgList");
    if (!list) return;
    let bar = $("#lgMissingBeneBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgMissingBeneBar";
      bar.className = "lg-missing-bene-bar";
      const filter = $("#lgFilterBar") || $("#lgDeptFilter");
      if (filter && filter.parentNode) filter.parentNode.insertBefore(bar, filter);
      else list.parentNode.insertBefore(bar, list);
    }
    try {
      const pending = await api("/api/legacy/missing-beneficiary");
      const n = Number(pending.count || 0);
      if (!n) {
        bar.hidden = true;
        bar.innerHTML = "";
        _lgBeneOnly = false;
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span>${esc(pending.hint || `有 ${n} 条还没写接收人`)}</span>
        <button type="button" class="btn ghost sm" id="lgBeneFilterBtn">${
          _lgBeneOnly ? "显示全部" : "筛出未指定接收人"
        }</button>`;
      const btn = $("#lgBeneFilterBtn");
      if (btn) {
        btn.onclick = () => {
          _lgBeneOnly = !_lgBeneOnly;
          applyMissingBeneFilter(pending.items || []);
          paintMissingBeneBar();
        };
      }
      if (_lgBeneOnly) applyMissingBeneFilter(pending.items || []);
    } catch (_) {}
  }

  function applyMissingBeneFilter(pendingItems) {
    const ids = new Set((pendingItems || []).map((x) => Number(x.id)));
    $$("#lgList .item[data-id]").forEach((el) => {
      if (!_lgBeneOnly) {
        el.hidden = false;
        return;
      }
      el.hidden = !ids.has(Number(el.dataset.id));
    });
    let tip = $("#lgBeneOnlyTip");
    if (_lgBeneOnly) {
      const visible = $$("#lgList .item[data-id]").filter((el) => !el.hidden);
      if (!visible.length) {
        if (!tip) {
          tip = document.createElement("p");
          tip.id = "lgBeneOnlyTip";
          tip.className = "muted";
          $("#lgList") && $("#lgList").appendChild(tip);
        }
        tip.textContent = "没有未指定接收人的条目了。";
      } else if (tip) tip.remove();
    } else if (tip) tip.remove();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    await paintMissingBeneBar();
  };

  /* 3 · 备忘复习到期日历点 */
  async function renderReviewCalendar() {
    const panel = $("#assets");
    const list = $("#asList");
    if (!panel || !list) return;
    let card = $("#asReviewCalCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "asReviewCalCard";
      card.className = "card";
      const bar = $("#asDisposePendingBar") || $("#asVisFilterBar") || $("#asDeptFilterBar");
      if (bar && bar.parentNode) bar.parentNode.insertBefore(card, bar);
      else list.parentNode.insertBefore(card, list);
    }
    try {
      const data = await api("/api/assets/review-calendar?days=14");
      const items = data.items || [];
      const selected =
        _reviewCalSelected || (items.find((d) => d.is_today) || {}).date || "";
      const sel = items.find((d) => d.date === selected) || items[items.length - 1];
      card.innerHTML = `<h3>备忘检视日历</h3>
        <p class="muted">${esc(data.note || "近 14 天有检视日的日期会温和标出。")}</p>
        <div class="checkin-cal review-cal" role="list">${items
          .map(
            (d) =>
              `<button type="button" role="listitem" class="cal-day ${
                d.has_review ? "has-check" : ""
              } ${d.is_today ? "is-today" : ""} ${
                d.date === selected ? "selected" : ""
              }" data-revcal="${esc(d.date)}" title="${esc(d.date)}">
            <span class="cal-wd">周${esc(d.weekday)}</span>
            <span class="cal-lb">${esc(d.label)}</span>
            <span class="cal-dot" aria-hidden="true"></span>
          </button>`
          )
          .join("")}</div>
        <p class="muted" id="revCalDetail">${
          sel
            ? sel.has_review
              ? `${esc(sel.date)} · 有 ${sel.review_count || 0} 条备忘安排检视`
              : `${esc(sel.date)} · 这一天暂无检视安排`
            : esc(data.text || "")
        }</p>
        <p class="muted">${esc(data.text || "")}</p>`;
      $$("#asReviewCalCard [data-revcal]").forEach((btn) => {
        btn.onclick = () => {
          _reviewCalSelected = btn.dataset.revcal || "";
          renderReviewCalendar();
        };
      });
    } catch (e) {
      card.innerHTML = `<h3>备忘检视日历</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    await renderReviewCalendar();
  };

  /* 4 · 报备历史折叠（默认最近 5 条） */
  function foldCheckinHistory() {
    const card = $("#checkinHistCard");
    if (!card) return;
    const items = $$("#checkinHistCard .checkin-hist .item");
    if (items.length <= HIST_PREVIEW) {
      const more = $("#checkinHistMore");
      if (more) more.remove();
      items.forEach((el) => {
        el.hidden = false;
      });
      return;
    }
    items.forEach((el, i) => {
      el.hidden = !_histExpanded && i >= HIST_PREVIEW;
    });
    let btn = $("#checkinHistMore");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "checkinHistMore";
      btn.className = "btn ghost block";
      card.appendChild(btn);
    }
    btn.textContent = _histExpanded
      ? "收起历史"
      : `查看更多（还有 ${items.length - HIST_PREVIEW} 条）`;
    btn.onclick = () => {
      _histExpanded = !_histExpanded;
      foldCheckinHistory();
    };
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    try {
      const hist = await api("/api/checkin/history?limit=30");
      const box = $("#checkinBox");
      if (!box) return;
      let card = $("#checkinHistCard");
      if (!card) {
        card = document.createElement("div");
        card.id = "checkinHistCard";
        card.className = "card";
        box.appendChild(card);
      }
      const items = hist.items || [];
      card.innerHTML = `<h3>报备历史</h3>
        <p class="muted">最近几次只读时间线，不改外呼升级流程。</p>
        <div class="list checkin-hist">${
          items.length
            ? items
                .map(
                  (it, i) =>
                    `<div class="item"><span class="tag">第 ${items.length - i} 次</span>
                    <strong>${esc(it.note || "生存报备")}</strong>
                    <div class="muted">${fmtTime(it.at)}</div></div>`
                )
                .join("")
            : "<p class='muted'>还没有报备记录。点上方「我已安全」即可留下第一条。</p>"
        }</div>`;
      foldCheckinHistory();
    } catch (_) {
      foldCheckinHistory();
    }
  };

  /* 5 · 会员权益对照卡 */
  async function paintMemberBenefits() {
    const box = $("#memberBox");
    if (!box) return;
    let card = $("#memberBenefitsCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "memberBenefitsCard";
      card.className = "card member-benefits-card";
      const first = box.querySelector(".card");
      if (first && first.nextSibling) box.insertBefore(card, first.nextSibling);
      else box.appendChild(card);
    }
    try {
      const data = await api("/api/membership/benefits");
      const rows = data.rows || [];
      card.innerHTML = `<h3>会员权益对照</h3>
        <p class="muted">${esc(data.note || "只读：报备 / 差旅门槛 / 手册导出是否就绪。")}</p>
        <div class="benefit-rows">${rows
          .map(
            (r) => `<div class="benefit-row ${r.ready ? "ready" : "pending"}">
            <span class="benefit-mark">${r.ready ? "就绪" : "待补"}</span>
            <div class="benefit-body">
              <strong>${esc(r.label)}</strong>
              <div class="muted">${esc(r.detail || "")}</div>
            </div>
            <button type="button" class="btn ghost sm" data-go="${esc(r.go || "member")}">查看</button>
          </div>`
          )
          .join("")}</div>
        <p class="muted">${esc(data.text || "")}</p>`;
    } catch (e) {
      card.innerHTML = `<h3>会员权益对照</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    await paintMemberBenefits();
  };

  /* 6 · 善后工单备注折叠 */
  function foldAftercareNotes() {
    $$("#acList .item").forEach((el) => {
      if (el.querySelector(".ac-note-expand")) return;
      const muted = Array.from(el.querySelectorAll(".muted")).find((m) => {
        const t = (m.textContent || "").trim();
        return (
          t.length > NOTE_FOLD_LEN &&
          !m.querySelector("input,select,button") &&
          !m.classList.contains("ac-phase-bar")
        );
      });
      if (!muted) return;
      const full = muted.textContent || "";
      muted.classList.add("note-fold", "collapsed");
      muted.dataset.full = full;
      muted.textContent = full.slice(0, NOTE_FOLD_LEN) + "…";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm note-expand ac-note-expand";
      btn.textContent = "展开备注";
      btn.onclick = () => {
        const collapsed = muted.classList.toggle("collapsed");
        if (collapsed) {
          muted.textContent = (muted.dataset.full || "").slice(0, NOTE_FOLD_LEN) + "…";
          btn.textContent = "展开备注";
        } else {
          muted.textContent = muted.dataset.full || "";
          btn.textContent = "收起备注";
        }
      };
      muted.insertAdjacentElement("afterend", btn);
    });
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    foldAftercareNotes();
  };

  /* 7 · 授权视频脚本一键复制 */
  function ensureAuthScriptCopy() {
    const script = $("#authScript");
    if (!script) return;
    let bar = $("#avScriptCopyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "avScriptCopyBar";
      bar.className = "row av-script-copy-bar";
      bar.style.cssText = "gap:8px;flex-wrap:wrap;margin:8px 0 12px";
      script.parentNode.insertBefore(bar, script.nextSibling);
    }
    bar.innerHTML = `<button type="button" class="btn ghost sm" id="avCopyScript">一键复制三段话术</button>
      <span class="muted" id="avCopyHint">录前可照着说，不改门槛流程。</span>`;
    const btn = $("#avCopyScript");
    if (!btn || btn.dataset.r15) return;
    btn.dataset.r15 = "1";
    btn.onclick = async () => {
      try {
        const st = await api("/api/auth-video");
        const lines = (st.script || []).map(
          (s, i) => `${i + 1}. ${s.title}\n   ${s.hint || ""}`
        );
        const text = lines.join("\n\n") || "（暂无话术）";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        toast("三段话术已复制");
        const hint = $("#avCopyHint");
        if (hint) hint.textContent = "已复制到剪贴板，可去录制时对照。";
      } catch (e) {
        toast(e.message || "复制失败");
      }
    };
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    ensureAuthScriptCopy();
  };

  /* 8 · 急症清册导出后打开手册 */
  function patchIcuApplyCta() {
    const btn = $("#icuApply");
    if (!btn || btn.dataset.r15) return;
    btn.dataset.r15 = "1";
    const prev = btn.onclick;
    btn.onclick = async (ev) => {
      try {
        const r = await api("/api/icu-pack", {
          method: "POST",
          body: JSON.stringify({
            beneficiary: ($("#icuBene") && $("#icuBene").value) || "",
          }),
        });
        toast(r.message || "已写入");
        softBanner("清册已写入交割手册", "icu", [
          {
            label: "打开交割手册",
            onClick: () => {
              if (typeof show === "function") show("handover");
            },
          },
        ]);
        if (typeof refreshIcu === "function") await refreshIcu();
      } catch (e) {
        toast(e.message);
        if (typeof prev === "function") return prev.call(btn, ev);
      }
    };
  }

  /* 9 · 医旅意向按医院名搜索 */
  function ensureMedIntentSearch() {
    let box = $("#medIntentSearchBox");
    const list = $("#medIntents");
    if (!list) return null;
    if (!box) {
      box = document.createElement("div");
      box.id = "medIntentSearchBox";
      box.className = "card filter-card";
      box.innerHTML = `<h3>按医院名搜索意向</h3>
        <label class="field">医院名 / 城市 / 备注
          <input id="medIntentQ" placeholder="本机过滤，也可走服务端关键词"/>
        </label>`;
      const statusBar = $("#medIntentStatusBar");
      if (statusBar && statusBar.parentNode) {
        statusBar.parentNode.insertBefore(box, statusBar);
      } else if (list.parentNode) {
        list.parentNode.insertBefore(box, list);
      }
      const input = box.querySelector("#medIntentQ");
      let t = null;
      input.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          _medIntentQ = (input.value || "").trim();
          if (typeof refreshMed === "function") {
            refreshMed(
              ($("#medQ") && $("#medQ").value.trim()) || "",
              ($("#medCountry") && $("#medCountry").value) || ""
            );
          }
        }, 180);
      });
    }
    const input = $("#medIntentQ");
    if (input && input.value !== _medIntentQ) input.value = _medIntentQ;
    return box;
  }

  function filterMedIntentsClient() {
    const q = (_medIntentQ || "").toLowerCase();
    if (!q) {
      $$("#medIntents .item").forEach((el) => {
        el.hidden = false;
      });
      const tip = $("#medIntentSearchEmpty");
      if (tip) tip.remove();
      return;
    }
    $$("#medIntents .item").forEach((el) => {
      const hay = (el.textContent || "").toLowerCase();
      el.hidden = !hay.includes(q);
    });
    let tip = $("#medIntentSearchEmpty");
    const visible = $$("#medIntents .item").filter((el) => !el.hidden);
    if (!visible.length) {
      if (!tip) {
        tip = document.createElement("p");
        tip.id = "medIntentSearchEmpty";
        tip.className = "muted";
        $("#medIntents") && $("#medIntents").appendChild(tip);
      }
      tip.textContent = "没有匹配的意向，换个医院名试试。";
    } else if (tip) tip.remove();
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    await _refreshMed(q, country, region);
    ensureMedIntentSearch();
    // Client filter on current list; server also accepts ?q= for selfcheck / deep link
    filterMedIntentsClient();
  };

  /* 10 · 设置·大字号预览开关强化 */
  function enhanceLargeTextToggle() {
    const toggle = $("#largeTextToggle");
    if (!toggle) return;
    let preview = $("#largeTextPreview");
    const card = toggle.closest(".card");
    if (card && !preview) {
      preview = document.createElement("p");
      preview.id = "largeTextPreview";
      preview.className = "large-text-preview muted";
      preview.textContent =
        "预览：开启后当前页字号立即放大，本机记住；关闭即恢复。不影响服务器数据。";
      const label = toggle.closest("label") || toggle.parentNode;
      if (label && label.parentNode) label.parentNode.insertBefore(preview, label.nextSibling);
      else card.appendChild(preview);
    }
    if (toggle.dataset.r15) return;
    toggle.dataset.r15 = "1";
    const apply = (on) => {
      localStorage.setItem(LARGE_KEY, on ? "1" : "0");
      document.body.classList.toggle("large-text", on);
      toggle.checked = on;
      if (preview) {
        preview.textContent = on
          ? "当前为大字号预览 · 本页已即时生效，刷新后仍保留。"
          : "预览：开启后当前页字号立即放大，本机记住；关闭即恢复。不影响服务器数据。";
      }
    };
    // Sync from storage on enter
    apply(localStorage.getItem(LARGE_KEY) === "1");
    toggle.onchange = (e) => {
      const on = e.target.checked;
      apply(on);
      toast(on ? "已开大字号（本页即时生效）" : "已恢复默认字号");
    };
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "settings") setTimeout(enhanceLargeTextToggle, 0);
    if (id === "icu") setTimeout(patchIcuApplyCta, 0);
    if (id === "authvideo") setTimeout(ensureAuthScriptCopy, 40);
    if (id === "member") setTimeout(() => paintMemberBenefits().catch(() => {}), 40);
    if (id === "aftercare") setTimeout(foldAftercareNotes, 40);
    if (id === "med") setTimeout(ensureMedIntentSearch, 40);
  };

  // Boot
  document.body.classList.toggle("large-text", localStorage.getItem(LARGE_KEY) === "1");
  if ($("#home") && $("#home").classList.contains("active")) {
    paintTodayTodos().catch(() => {});
  }
  if ($("#icu") && $("#icu").classList.contains("active")) patchIcuApplyCta();
})();
