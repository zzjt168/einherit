/* 电子继承 · 第二十四批增量（叠在 round23…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const LARGE_KEY = "einherit_large_text";
  const NOTE_SOFT = 120;
  const NOTE_LONG = 280;

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round24SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
    }
    if (!el.parentNode || el.parentNode !== host) {
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
    }, 9000);
    return el;
  }

  function calmConfirm({ title, body, okLabel }) {
    return new Promise((resolve) => {
      const dlg = $("#confirmDialog");
      if (!dlg || typeof dlg.showModal !== "function") {
        resolve(window.confirm(body || title || "是否继续？"));
        return;
      }
      const t = $("#confirmTitle");
      const b = $("#confirmBody");
      const ok = $("#confirmOk");
      if (t) t.textContent = title || "确认操作";
      if (b) b.textContent = body || "是否继续？";
      if (ok) ok.textContent = okLabel || "确认";
      const onClose = () => {
        dlg.removeEventListener("close", onClose);
        resolve(dlg.returnValue === "ok");
      };
      dlg.addEventListener("close", onClose);
      try {
        dlg.showModal();
      } catch (_) {
        resolve(window.confirm(body || title || "是否继续？"));
      }
    });
  }

  /* 1 · 首页七宗罪自保进度一句 */
  async function paintHomeGuardProgress() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeGuardProgressBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeGuardProgressBar";
      bar.className = "home-guard-progress-bar";
      bar.setAttribute("role", "status");
      const dual = $("#homeMemberTravelDual");
      const auth = $("#homeAuthGateBar");
      const icu = $("#homeIcuReadyBar");
      const r20 = $("#homeRound20Ready");
      const progress = $("#homeLegacyProgress");
      const hint = $("#homeHint");
      if (dual && dual.parentNode === home) dual.insertAdjacentElement("afterend", bar);
      else if (auth && auth.parentNode === home) auth.insertAdjacentElement("afterend", bar);
      else if (icu && icu.parentNode === home) icu.insertAdjacentElement("afterend", bar);
      else if (r20 && r20.parentNode === home) r20.insertAdjacentElement("afterend", bar);
      else if (progress && progress.parentNode === home)
        progress.insertAdjacentElement("afterend", bar);
      else if (hint && hint.parentNode === home) hint.insertAdjacentElement("afterend", bar);
      else home.appendChild(bar);
    }
    try {
      const data = await api("/api/self-guard");
      const prog = data.progress || {};
      const done = Number(prog.done || 0);
      const total = Number(prog.total || 7);
      let line;
      if (done <= 0) line = "自保尚未勾选 · 按危害序慢慢看即可";
      else if (done >= total) line = "自保已勾齐 " + done + "/" + total + " · 可随时回看";
      else line = "已勾 " + done + "/" + total + " · 按自己节奏继续即可";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-guard-mark">自保</span>
        <span class="muted home-guard-sub">${esc(line)}</span>
        <button type="button" class="btn ghost sm" id="homeGuardGo">去自保</button>`;
      const btn = $("#homeGuardGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("guard");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割备注字数提示（温和，不截断） */
  function ensureLegacyNotesCount() {
    const ta = $("#lgNotes");
    if (!ta) return;
    let hint = $("#lgNotesCount");
    if (!hint) {
      hint = document.createElement("p");
      hint.id = "lgNotesCount";
      hint.className = "muted lg-notes-count";
      hint.setAttribute("aria-live", "polite");
      const field = ta.closest("label") || ta.parentNode;
      if (field) field.insertAdjacentElement("afterend", hint);
      else ta.insertAdjacentElement("afterend", hint);
    }
    if (!ta.dataset.r24count) {
      ta.dataset.r24count = "1";
      ta.addEventListener("input", updateLegacyNotesCount);
    }
    updateLegacyNotesCount();
  }

  function updateLegacyNotesCount() {
    const ta = $("#lgNotes");
    const hint = $("#lgNotesCount");
    if (!ta || !hint) return;
    const n = (ta.value || "").length;
    if (n === 0) {
      hint.textContent = "";
      hint.hidden = true;
      return;
    }
    hint.hidden = false;
    if (n >= NOTE_LONG) {
      hint.textContent = n + " 字 · 稍长也没关系，执行人会慢慢看";
    } else if (n >= NOTE_SOFT) {
      hint.textContent = n + " 字 · 可再精炼，不必勉强";
    } else {
      hint.textContent = n + " 字";
    }
  }

  /* 3 · 备忘搜索清空（对标交割搜索清空） */
  function ensureAssetSearchClear() {
    const box = $("#asSearchBox");
    const input = $("#asSearchQ");
    if (!box || !input) return;
    let btn = $("#asSearchClear");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "asSearchClear";
      btn.className = "btn ghost sm as-search-clear";
      btn.textContent = "清空";
      const field = input.closest("label") || input.parentNode;
      if (field) {
        const row = document.createElement("div");
        row.className = "row as-search-clear-row";
        row.style.cssText =
          "gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px";
        row.appendChild(btn);
        field.insertAdjacentElement("afterend", row);
      } else {
        box.appendChild(btn);
      }
      btn.onclick = () => {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        softBanner("搜索已清空", "assets");
        toast("已清空关键词");
      };
    }
    const has = !!(input.value || "").trim();
    btn.hidden = !has;
  }

  function bindAssetSearchClear() {
    const input = $("#asSearchQ");
    if (!input || input.dataset.r24clear) return;
    input.dataset.r24clear = "1";
    input.addEventListener("input", ensureAssetSearchClear);
    ensureAssetSearchClear();
  }

  /* 4 · 报备间隔预设 chip（24/48/72，只写 interval 输入） */
  function ensureIntervalPresetChips() {
    ["checkinIntervalCard", "settingsIntervalCard"].forEach((cardId) => {
      const input = $("#" + cardId + "_input");
      if (!input) return;
      let bar = $("#" + cardId + "_presets");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = cardId + "_presets";
        bar.className = "chip-row interval-preset-chips";
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", "报备间隔快捷");
        const field = input.closest("label") || input.parentNode;
        if (field) field.insertAdjacentElement("afterend", bar);
        else input.insertAdjacentElement("afterend", bar);
      }
      const cur = String(Number(input.value || 24));
      const presets = [
        { h: 24, label: "24 小时" },
        { h: 48, label: "48 小时" },
        { h: 72, label: "72 小时" },
      ];
      bar.innerHTML = presets
        .map(
          (p) =>
            `<button type="button" class="chip ${
              String(p.h) === cur ? "active" : ""
            }" data-interval-h="${p.h}">${p.label}</button>`
        )
        .join("");
      $$("#" + cardId + "_presets [data-interval-h]").forEach((btn) => {
        btn.onclick = () => {
          const h = Number(btn.dataset.intervalH || 24);
          input.value = String(h);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          ensureIntervalPresetChips();
          softBanner("已填入 " + h + " 小时（记得保存）", cardId.indexOf("settings") === 0 ? "settings" : "checkin");
          toast("已填入 " + h + " 小时");
        };
      });
    });
  }

  /* 5 · 差旅流水金额着色只读（入账/退款温和色差） */
  function paintTravelLedgerAmounts() {
    const box = $("#travelBox");
    if (!box) return;
    const cards = $$("#travelBox .card");
    const ledgerCard = Array.from(cards).find((c) => {
      const h = c.querySelector("h3");
      return h && /流水|相关/.test(h.textContent || "");
    });
    if (!ledgerCard) return;
    $$(".item", ledgerCard).forEach((el) => {
      const tag = (el.querySelector(".tag") && el.querySelector(".tag").textContent) || "";
      const kind = (el.dataset.ledgerKind || "").toLowerCase();
      const isRefund =
        el.classList.contains("ledger-refund") ||
        kind === "refund" ||
        /退回|退款|refund/i.test(tag) ||
        /travel_refund/i.test(tag);
      const isDeposit =
        kind === "deposit" ||
        /充值|入账|deposit|travel_deposit|membership/i.test(tag + " " + kind);
      el.classList.toggle("tf-ledger-refund", isRefund);
      el.classList.toggle("tf-ledger-deposit", !isRefund && isDeposit);
      const muted = el.querySelector(".muted");
      if (!muted || muted.dataset.r24amt) return;
      muted.dataset.r24amt = "1";
      const raw = muted.innerHTML;
      const cls = isRefund ? "tf-amt tf-amt-refund" : "tf-amt tf-amt-deposit";
      muted.innerHTML = raw.replace(
        /(¥\s*[\d,]+(?:\.\d+)?|-?\s*¥\s*[\d,]+(?:\.\d+)?)/,
        '<span class="' + cls + '">$1</span>'
      );
    });
  }

  /* 6 · 善后联系窗口快捷 chip → contact_window */
  function ensureContactWindowChips() {
    ensureContactWindowFieldSafe();
    const input = $("#acContactWindow");
    if (!input) return;
    let bar = $("#acContactWindowChips");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "acContactWindowChips";
      bar.className = "chip-row ac-contact-window-chips";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "联系窗口快捷");
      const field = input.closest("label") || input.parentNode;
      if (field) field.insertAdjacentElement("afterend", bar);
      else input.insertAdjacentElement("afterend", bar);
    }
    const chips = [
      { v: "上午", label: "上午" },
      { v: "下午", label: "下午" },
      { v: "晚上", label: "晚上" },
    ];
    const cur = (input.value || "").trim();
    bar.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="chip ${
            cur === c.v ? "active" : ""
          }" data-cw="${esc(c.v)}">${esc(c.label)}</button>`
      )
      .join("");
    $$("#acContactWindowChips [data-cw]").forEach((btn) => {
      btn.onclick = () => {
        const v = btn.dataset.cw || "";
        input.value = v;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        ensureContactWindowChips();
        softBanner("已填入联系窗口：" + v, "aftercare");
        toast("已填入「" + v + "」");
      };
    });
  }

  function ensureContactWindowFieldSafe() {
    if ($("#acContactWindow")) return;
    const form = $("#acAdd") && $("#acAdd").closest(".card");
    if (!form) return;
    const notes = $("#acNotes");
    const field = document.createElement("label");
    field.className = "field";
    field.innerHTML = `联系窗口（可选）<input id="acContactWindow" placeholder="例如：工作日上午"/>`;
    if (notes && notes.parentNode) notes.parentNode.insertBefore(field, notes);
    else form.insertBefore(field, $("#acAdd"));
  }

  /* 7 · 授权视频脚本分段跳转 */
  function ensureAuthScriptJump() {
    const ol = $("#authScript");
    if (!ol) return;
    const items = $$("#authScript li");
    if (!items.length) return;
    const keys = ["greeting", "authorize", "plan"];
    const labels = ["问候", "授权", "思路"];
    items.forEach((li, i) => {
      const key = keys[i] || "seg" + i;
      li.id = "avScriptSeg_" + key;
      li.dataset.scriptKey = key;
      li.classList.add("av-script-seg");
    });
    let bar = $("#avScriptJumpBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "avScriptJumpBar";
      bar.className = "chip-row av-script-jump-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "脚本分段跳转");
      const copyBar = $("#avScriptCopyBar");
      if (copyBar && copyBar.parentNode) copyBar.insertAdjacentElement("beforebegin", bar);
      else ol.parentNode.insertBefore(bar, ol);
    }
    bar.innerHTML = labels
      .map(
        (lab, i) =>
          `<button type="button" class="chip" data-av-jump="${keys[i]}">${lab}</button>`
      )
      .join("");
    $$("#avScriptJumpBar [data-av-jump]").forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.avJump;
        const target = $("#avScriptSeg_" + key);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("av-script-seg-flash");
          setTimeout(() => target.classList.remove("av-script-seg-flash"), 1200);
        }
        softBanner("已滚到「" + (btn.textContent || "") + "」段", "authvideo");
      };
    });
  }

  /* 8 · 急症清册重复写入确认 */
  function patchIcuReapplyConfirm() {
    const btn = $("#icuApply");
    if (!btn || btn.dataset.r24icu) return;
    btn.dataset.r24icu = "1";
    const prev = btn.onclick;
    btn.onclick = async (ev) => {
      try {
        const data = await api("/api/icu-pack");
        if (data && data.ready) {
          const ok = await calmConfirm({
            title: "再次写入急症前清册？",
            body: "清册已写入过。再次应用会按模板温和补齐，不会恐吓覆盖。按自己节奏即可。",
            okLabel: "再次写入",
          });
          if (!ok) return;
        }
        if (typeof prev === "function") return await prev.call(btn, ev);
        const r = await api("/api/icu-pack", {
          method: "POST",
          body: JSON.stringify({
            beneficiary: ($("#icuBene") && $("#icuBene").value) || "",
          }),
        });
        toast(r.message || "已写入");
        if (typeof refreshIcu === "function") await refreshIcu();
      } catch (e) {
        toast(e.message || "未完成");
      }
    };
  }

  /* 9 · 医旅意向备注一键清空（编辑态） */
  function ensureMedNoteClear() {
    const input = $("#medNote");
    if (!input) return;
    let btn = $("#medNoteClear");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "medNoteClear";
      btn.className = "btn ghost sm med-note-clear";
      btn.textContent = "清空备注";
      const field = input.closest("label") || input.parentNode;
      if (field) {
        const row = document.createElement("div");
        row.className = "row med-note-clear-row";
        row.style.cssText =
          "gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px";
        row.appendChild(btn);
        field.insertAdjacentElement("afterend", row);
      } else {
        input.insertAdjacentElement("afterend", btn);
      }
      btn.onclick = () => {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        softBanner("意向备注已清空", "med");
        toast("已清空备注");
        ensureMedNoteClear();
      };
    }
    const has = !!(input.value || "").trim();
    btn.hidden = !has;
    if (!input.dataset.r24noteclear) {
      input.dataset.r24noteclear = "1";
      input.addEventListener("input", ensureMedNoteClear);
    }
  }

  /* 10 · 设置·主题对比度提示（大字号开启时「阅读更轻松」） */
  function enhanceLargeTextContrastHint() {
    const toggle = $("#largeTextToggle");
    if (!toggle) return;
    let hint = $("#largeTextContrastHint");
    const card = toggle.closest(".card");
    if (card && !hint) {
      hint = document.createElement("p");
      hint.id = "largeTextContrastHint";
      hint.className = "muted large-text-contrast-hint";
      hint.setAttribute("aria-live", "polite");
      const preview = $("#largeTextPreview");
      if (preview && preview.parentNode) {
        preview.insertAdjacentElement("afterend", hint);
      } else {
        const label = toggle.closest("label") || toggle.parentNode;
        if (label && label.parentNode) label.parentNode.insertBefore(hint, label.nextSibling);
        else card.appendChild(hint);
      }
    }
    const sync = () => {
      const on =
        toggle.checked ||
        document.body.classList.contains("large-text") ||
        localStorage.getItem(LARGE_KEY) === "1";
      if (hint) {
        if (on) {
          hint.hidden = false;
          hint.textContent = "阅读更轻松 · 字号已放大，对比度更柔和";
        } else {
          hint.hidden = true;
          hint.textContent = "";
        }
      }
    };
    if (!toggle.dataset.r24contrast) {
      toggle.dataset.r24contrast = "1";
      toggle.addEventListener("change", () => setTimeout(sync, 0));
    }
    sync();
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => {
      bindAssetSearchClear();
      ensureAssetSearchClear();
    }, 40);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(ensureLegacyNotesCount, 40);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(paintTravelLedgerAmounts, 40);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(ensureIntervalPresetChips, 60);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(ensureAuthScriptJump, 40);
  };

  const _refreshGuard = window.refreshGuard;
  window.refreshGuard = async function () {
    await _refreshGuard();
    paintHomeGuardProgress().catch(() => {});
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeGuardProgress().catch(() => {}), 0);
    if (id === "legacy") setTimeout(ensureLegacyNotesCount, 60);
    if (id === "assets")
      setTimeout(() => {
        bindAssetSearchClear();
        ensureAssetSearchClear();
      }, 60);
    if (id === "checkin") setTimeout(ensureIntervalPresetChips, 80);
    if (id === "travel") setTimeout(paintTravelLedgerAmounts, 60);
    if (id === "aftercare") setTimeout(ensureContactWindowChips, 60);
    if (id === "authvideo") setTimeout(ensureAuthScriptJump, 80);
    if (id === "icu") setTimeout(patchIcuReapplyConfirm, 40);
    if (id === "med") setTimeout(ensureMedNoteClear, 40);
    if (id === "settings") {
      setTimeout(() => {
        ensureIntervalPresetChips();
        enhanceLargeTextContrastHint();
      }, 80);
      setTimeout(() => {
        ensureIntervalPresetChips();
        enhanceLargeTextContrastHint();
      }, 350);
    }
  };

  // Boot
  paintHomeGuardProgress().catch(() => {});
  ensureLegacyNotesCount();
  bindAssetSearchClear();
  ensureAssetSearchClear();
  ensureContactWindowChips();
  ensureMedNoteClear();
  patchIcuReapplyConfirm();
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    setTimeout(ensureIntervalPresetChips, 100);
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    setTimeout(paintTravelLedgerAmounts, 80);
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    setTimeout(ensureAuthScriptJump, 100);
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      ensureIntervalPresetChips();
      enhanceLargeTextContrastHint();
    }, 120);
  }
})();
