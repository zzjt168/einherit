/* 电子继承 · 第十一批增量（叠在 round10…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const NOTE_FOLD_LEN = 48;
  let _lgSearchQ = "";

  function softBanner(msg, hostId) {
    const host = (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return;
    const eid = "round11SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner";
      el.hidden = true;
      host.insertBefore(el, host.firstChild);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function emptyState(title, hint, go, cta) {
    return `<div class="empty-state">
      <p class="empty-title">${esc(title)}</p>
      <p class="empty-hint">${esc(hint)}</p>
      ${
        go
          ? `<button type="button" class="btn ghost sm" data-go="${esc(go)}">${esc(
              cta || "去看看"
            )}</button>`
          : ""
      }
    </div>`;
  }

  /* 1 · 交割搜索（标题 / 接收人） */
  function ensureLegacySearch() {
    let box = $("#lgSearchBox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "lgSearchBox";
    box.className = "card filter-card";
    box.innerHTML = `<h3>关键词搜索</h3>
      <label class="field">标题 / 接收人<input id="lgSearchQ" placeholder="本机过滤，不上传" value="${esc(
        _lgSearchQ
      )}"/></label>`;
    const list = $("#lgList");
    const deptBar = $("#lgDeptFilterBar");
    if (deptBar && deptBar.parentNode) deptBar.parentNode.insertBefore(box, deptBar);
    else if (list && list.parentNode) list.parentNode.insertBefore(box, list);
    const input = box.querySelector("#lgSearchQ");
    if (input) {
      input.addEventListener("input", () => {
        _lgSearchQ = (input.value || "").trim();
        applyLegacySearch();
      });
    }
    return box;
  }

  async function applyLegacySearch() {
    ensureLegacySearch();
    const list = $("#lgList");
    if (!list) return;
    const q = (_lgSearchQ || "").trim().toLowerCase();
    try {
      if (q) {
        const { items } = await api("/api/legacy?q=" + encodeURIComponent(_lgSearchQ));
        const byId = new Set((items || []).map((it) => String(it.id)));
        $$("#lgList .item[data-id]").forEach((el) => {
          el.hidden = !byId.has(String(el.dataset.id));
        });
        // also filter items without data-id via text
        $$("#lgList .item").forEach((el) => {
          if (el.dataset.id) return;
          const hay = (el.textContent || "").toLowerCase();
          el.hidden = q ? !hay.includes(q) : false;
        });
      } else {
        $$("#lgList .item").forEach((el) => {
          el.hidden = false;
        });
      }
    } catch (_) {
      $$("#lgList .item").forEach((el) => {
        const hay = (el.textContent || "").toLowerCase();
        el.hidden = q ? !hay.includes(q) : false;
      });
    }
    let tip = $("#lgSearchEmpty");
    const visible = $$("#lgList .item").filter((el) => !el.hidden);
    if (q && !visible.length) {
      if (!tip) {
        tip = document.createElement("div");
        tip.id = "lgSearchEmpty";
        if (list.parentNode) list.parentNode.insertBefore(tip, list.nextSibling);
      }
      tip.innerHTML = emptyState(
        "没有匹配的交割条目",
        "换个关键词，或再写一条标题与接收人安排。",
        "legacy",
        "新增交割安排"
      );
    } else if (tip) tip.remove();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    ensureLegacySearch();
    await fillLegacyBenePick();
    // ensure data-id for search API match
    try {
      const { items } = await api("/api/legacy");
      const byTitle = {};
      (items || []).forEach((it) => {
        byTitle[String(it.id)] = it;
      });
      const nodes = $$("#lgList .item");
      (items || []).forEach((it, i) => {
        const el = nodes[i];
        if (el && !el.dataset.id) el.dataset.id = String(it.id);
        if (el) {
          el.dataset.beneficiary = it.beneficiary || "";
          el.dataset.title = it.title || "";
        }
      });
    } catch (_) {}
    await applyLegacySearch();
  };

  /* 2 · 受益人挂接快捷选 */
  async function fillLegacyBenePick() {
    const sel = $("#lgBenePick");
    if (!sel) return;
    try {
      const { items } = await api("/api/beneficiaries");
      const cur = sel.value || "";
      sel.innerHTML =
        `<option value="">不指定（或下方手写）</option>` +
        (items || [])
          .map(
            (b) =>
              `<option value="${b.id}">${esc(b.name)}（${esc(b.role || "")}）</option>`
          )
          .join("");
      if (cur) sel.value = cur;
      const list = $("#lgBeneList");
      if (list) {
        list.innerHTML = (items || [])
          .map((b) => `<option value="${esc(b.name)}"></option>`)
          .join("");
      }
    } catch (_) {}
  }

  function bindLegacyBenePick() {
    const add = $("#lgAdd");
    if (!add || add.dataset.r11) return;
    add.dataset.r11 = "1";
    const prev = add.onclick;
    add.onclick = async (ev) => {
      const pick = $("#lgBenePick");
      const bid = pick ? Number(pick.value || 0) : 0;
      // Prefer sending beneficiary_id when picked; keep handwritten name as fallback
      try {
        const payload = {
          title: ($("#lgTitle") && $("#lgTitle").value) || "",
          category: ($("#lgCat") && $("#lgCat").value) || "其他",
          action: ($("#lgAction") && $("#lgAction").value) || "销毁",
          beneficiary: ($("#lgBene") && $("#lgBene").value) || "",
          notes: ($("#lgNotes") && $("#lgNotes").value) || "",
          dept: ($("#lgDept") && $("#lgDept").value) || "admin",
          factory_reset: !!( $("#lgReset") && $("#lgReset").checked),
          clear_photos: !!( $("#lgPhotos") && $("#lgPhotos").checked),
          clear_chats: !!( $("#lgChats") && $("#lgChats").checked),
        };
        if (bid > 0) payload.beneficiary_id = bid;
        await api("/api/legacy", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if ($("#lgTitle")) $("#lgTitle").value = "";
        if ($("#lgNotes")) $("#lgNotes").value = "";
        if (pick) pick.value = "";
        toast(bid > 0 ? "已写入交割手册（已挂接受益人）" : "已写入交割手册");
        if (typeof refreshLegacy === "function") refreshLegacy();
      } catch (e) {
        toast(e.message);
        if (typeof prev === "function") return prev.call(add, ev);
      }
    };
  }

  /* 3 · 报备间隔可调只读回显（设置 + 报备页，只写 interval） */
  async function renderIntervalEcho(hostSel, cardId) {
    const host = $(hostSel);
    if (!host) return;
    let card = $("#" + cardId);
    if (!card) {
      card = document.createElement("div");
      card.id = cardId;
      card.className = "card";
      host.appendChild(card);
    }
    try {
      const data = await api("/api/checkin/interval");
      const hours = data.interval_hours != null ? data.interval_hours : 24;
      card.innerHTML = `<h3>报备间隔</h3>
        <p class="muted">当前间隔只读回显；改动只写间隔小时，不改外呼升级。</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">当前间隔</span><b style="font-size:16px">${esc(
            String(hours)
          )} 小时</b></div>
          <div class="box"><span class="muted">下次建议</span><b style="font-size:14px">${esc(
            data.next_suggested_label || "—"
          )}</b></div>
        </div>
        <label class="field" style="margin-top:10px">温和调整（小时）
          <input type="number" id="${cardId}_input" min="1" max="720" value="${esc(
            String(hours)
          )}"/>
        </label>
        <button type="button" class="btn ghost" id="${cardId}_save">保存间隔</button>
        <p class="muted" style="margin-top:8px">${esc(data.readable || "")}</p>`;
      const btn = $("#" + cardId + "_save");
      const input = $("#" + cardId + "_input");
      if (btn && input) {
        btn.onclick = async () => {
          try {
            const r = await api("/api/checkin/interval", {
              method: "POST",
              body: JSON.stringify({ interval_hours: Number(input.value || 24) }),
            });
            toast("报备间隔已更新");
            softBanner(r.note || "已更新报备间隔。", hostSel.replace("#", "") || "settings");
            renderIntervalEcho(hostSel, cardId);
            if (typeof refreshCheckin === "function") refreshCheckin();
          } catch (e) {
            toast(e.message);
          }
        };
      }
    } catch (e) {
      card.innerHTML = `<h3>报备间隔</h3><p class="muted">暂不可用：${esc(e.message)}</p>`;
    }
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await renderIntervalEcho("#checkinBox", "checkinIntervalCard");
  };

  /* 4 · 差旅门槛达标徽标 */
  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    try {
      const { fund } = await api("/api/travel-fund");
      const box = $("#travelBox .card");
      if (!box) return;
      let badge = $("#travelThresholdBadge");
      const met = !!(fund.meets_threshold || fund.met);
      if (!badge) {
        badge = document.createElement("div");
        badge.id = "travelThresholdBadge";
        badge.className = "threshold-badge";
        const h = box.querySelector("h3");
        if (h) h.insertAdjacentElement("afterend", badge);
        else box.insertBefore(badge, box.firstChild);
      }
      if (met) {
        badge.hidden = false;
        badge.classList.add("is-met");
        badge.innerHTML = `<span class="threshold-badge-mark" aria-hidden="true">✓</span>
          <span>已达预存门槛</span>
          <span class="muted">≥¥${Number(fund.threshold || 2000)}</span>`;
      } else {
        badge.hidden = false;
        badge.classList.remove("is-met");
        badge.innerHTML = `<span class="threshold-badge-mark soft" aria-hidden="true">·</span>
          <span>预存进行中</span>
          <span class="muted">建议 ≥¥${Number(fund.threshold || 2000)}</span>`;
      }
    } catch (_) {}
  };

  /* 5 · 工单差旅预算上限提示 */
  async function refreshBudgetTip() {
    const tip = $("#acBudgetTip");
    const input = $("#acTravel");
    if (!tip) return;
    const budget = Number((input && input.value) || 0);
    try {
      const hint = await api(
        "/api/aftercare/budget-hint?budget=" + encodeURIComponent(String(budget || 0))
      );
      tip.className = "budget-tip tone-" + (hint.tone || "soft");
      tip.textContent = hint.text || "";
    } catch (e) {
      tip.className = "budget-tip tone-soft";
      tip.textContent = e.message || "差旅对照暂不可用";
    }
  }

  function bindBudgetTip() {
    const input = $("#acTravel");
    if (input && !input.dataset.r11) {
      input.dataset.r11 = "1";
      input.addEventListener("input", () => refreshBudgetTip());
      input.addEventListener("change", () => refreshBudgetTip());
    }
    refreshBudgetTip();
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    bindBudgetTip();
  };

  /* 6 · 授权视频上传后门槛绿勾 */
  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      const card = $("#avUploadCard");
      if (!card) return;
      let top = $("#avCompleteBanner");
      if (!top) {
        top = document.createElement("div");
        top.id = "avCompleteBanner";
        top.className = "av-complete-banner";
        card.insertBefore(top, card.firstChild);
      }
      const ready = !!(st.ready || st.complete);
      if (ready) {
        top.hidden = false;
        top.classList.add("is-ready");
        top.innerHTML = `<span class="av-complete-check" aria-hidden="true">✓</span>
          <div>
            <strong>${esc(st.complete_label || "三项齐备，可提交善后工单")}</strong>
            <p class="muted" style="margin:4px 0 0">问候 · 授权 · 思路均已齐备</p>
          </div>`;
      } else {
        const prog = st.progress || { done: 0, total: 3 };
        top.hidden = false;
        top.classList.remove("is-ready");
        top.innerHTML = `<span class="av-complete-check soft" aria-hidden="true">·</span>
          <div>
            <strong>门槛进行中 ${esc(String(prog.done || 0))}/${esc(
          String(prog.total || 3)
        )}</strong>
            <p class="muted" style="margin:4px 0 0">${esc(
              st.complete_label || "三项齐备后即可提交善后工单"
            )}</p>
          </div>`;
      }
    } catch (_) {}
  };

  /* 7 · 紧急取用列表空态 CTA */
  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    try {
      const { items } = await api("/api/emergency");
      if ((items || []).length) return;
      // Find emergency list card inside heirsBox and replace empty muted with CTA
      const box = $("#heirsBox");
      if (!box) return;
      const cards = $$(".card", box);
      const emerCard = cards.find((c) => {
        const h = c.querySelector("h3");
        return h && (h.textContent || "").includes("紧急取用");
      });
      if (!emerCard) return;
      const list = emerCard.querySelector(".list") || emerCard;
      const muted = list.querySelector("p.muted");
      if (muted && /暂无申请/.test(muted.textContent || "")) {
        muted.outerHTML = emptyState(
          "还没有紧急取用申请",
          "先把受益人写进名册，需要时再温和发起申请即可。",
          "heirs",
          "去受益人名册"
        );
      } else if (!list.querySelector(".empty-state") && !list.querySelector(".item")) {
        const wrap = document.createElement("div");
        wrap.innerHTML = emptyState(
          "还没有紧急取用申请",
          "先把受益人写进名册，需要时再温和发起申请即可。",
          "heirs",
          "去受益人名册"
        );
        list.appendChild(wrap.firstChild);
      }
    } catch (_) {}
  };

  /* 8 · 手册打印前检查清单 */
  async function renderPrintChecklist() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handPrintChecklist");
    if (!card) {
      card = document.createElement("div");
      card.id = "handPrintChecklist";
      card.className = "card";
      const first = box.querySelector(".card");
      if (first) first.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    try {
      const data = await api("/api/handover/print-checklist");
      const rows = (data.items || [])
        .map(
          (it) => `<div class="print-check-row ${it.ok ? "ok" : "miss"}">
            <span class="print-check-mark" aria-hidden="true">${it.ok ? "✓" : "·"}</span>
            <div>
              <strong>${esc(it.label)}</strong>
              <span class="muted"> · ${esc(it.value || "")}</span>
              <div class="muted">${esc(it.hint || "")}</div>
            </div>
          </div>`
        )
        .join("");
      card.innerHTML = `<h3>打印前检查</h3>
        <p class="muted">${esc(data.note || "导出前温和核对执行人、条目与受益人。")}</p>
        <div class="print-check-list">${rows}</div>
        <p class="muted" style="margin-top:8px">${esc(data.text || "")}</p>`;
    } catch (e) {
      card.innerHTML = `<h3>打印前检查</h3><p class="muted">${esc(e.message)}</p>`;
    }
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await renderPrintChecklist();
  };

  /* 9 · 医旅意向备注展开 */
  function foldMedIntentNotes() {
    $$("#medIntents .item").forEach((el) => {
      if (el.querySelector(".med-note-expand")) return;
      const muted = Array.from(el.querySelectorAll(".muted")).find((m) => {
        const t = (m.textContent || "").trim();
        return t.length > NOTE_FOLD_LEN && !m.querySelector("input,select,button");
      });
      if (!muted) return;
      const full = muted.textContent || "";
      muted.classList.add("note-fold", "collapsed");
      muted.dataset.full = full;
      muted.textContent = full.slice(0, NOTE_FOLD_LEN) + "…";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm note-expand med-note-expand";
      btn.textContent = "展开";
      btn.onclick = () => {
        const collapsed = muted.classList.toggle("collapsed");
        if (collapsed) {
          muted.textContent = (muted.dataset.full || "").slice(0, NOTE_FOLD_LEN) + "…";
          btn.textContent = "展开";
        } else {
          muted.textContent = muted.dataset.full || "";
          btn.textContent = "收起";
        }
      };
      muted.insertAdjacentElement("afterend", btn);
    });
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q = "", country = "", region) {
    await _refreshMed(q, country, region);
    foldMedIntentNotes();
  };

  /* 10 · 设置·数据体量一览 */
  async function ensureDataVolumeCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDataVolumeCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDataVolumeCard";
      card.className = "card";
      box.appendChild(card);
    }
    try {
      const summary = await api("/api/counts-summary");
      const cards =
        summary.cards ||
        [
          { key: "legacy", label: "交割", count: (summary.counts || {}).legacy || 0 },
          { key: "assets", label: "备忘", count: (summary.counts || {}).assets || 0 },
          {
            key: "beneficiaries",
            label: "受益人",
            count: (summary.counts || {}).beneficiaries || 0,
          },
          { key: "aftercare", label: "工单", count: (summary.counts || {}).aftercare || 0 },
        ];
      card.innerHTML = `<h3>数据体量一览</h3>
        <p class="muted">${esc(summary.note || "本机关键列表条数，便于温和确认。")}</p>
        <div class="stat data-volume-stat" style="margin-top:12px">
          ${cards
            .map(
              (c) =>
                `<div class="box"><span class="muted">${esc(c.label)}</span><b style="font-size:18px">${esc(
                  String(c.count != null ? c.count : 0)
                )}</b></div>`
            )
            .join("")}
        </div>
        <p class="muted" style="margin-top:8px">${esc(summary.text || "")}</p>`;
    } catch (e) {
      card.innerHTML = `<h3>数据体量一览</h3><p class="muted">${esc(e.message)}</p>`;
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "legacy") {
      setTimeout(() => {
        ensureLegacySearch();
        fillLegacyBenePick();
        bindLegacyBenePick();
      }, 0);
    }
    if (id === "settings") {
      setTimeout(() => {
        ensureDataVolumeCard();
        renderIntervalEcho("#settingsBox", "settingsIntervalCard");
      }, 40);
    }
    if (id === "checkin") {
      setTimeout(() => renderIntervalEcho("#checkinBox", "checkinIntervalCard"), 40);
    }
    if (id === "aftercare") setTimeout(() => bindBudgetTip(), 0);
    if (id === "authvideo" && typeof refreshAuthVideo === "function") {
      /* refreshAuthVideo already wired */
    }
    if (id === "handover") setTimeout(() => renderPrintChecklist(), 40);
    if (id === "med") setTimeout(() => foldMedIntentNotes(), 40);
    if (id === "heirs" && typeof refreshHeirs === "function") {
      /* refreshHeirs already wired */
    }
  };

  // boot
  bindLegacyBenePick();
  fillLegacyBenePick();
  bindBudgetTip();
})();
