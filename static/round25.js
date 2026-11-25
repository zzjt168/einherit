/* 电子继承 · 第二十五批增量（叠在 round24…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const HAPTIC_KEY = "einherit_checkin_haptic";
  const PLATFORM_UNDO = { prev: "", timer: null };

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round25SoftBanner_" + (hostId || "home");
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

  async function copyText(str) {
    const text = String(str || "");
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  function capitalizePlatform(raw) {
    const s = String(raw || "");
    if (!s) return s;
    // 温和：仅把首个拉丁小写字母改为大写；中文/已大写不动
    return s.replace(/^(\s*)([a-z])/, (_, sp, ch) => sp + ch.toUpperCase());
  }

  /* 1 · 首页五部门完成度环回显强化 */
  async function enhanceHomeDeptRing() {
    const ring = $("#homeDeptRing");
    if (!ring) return;
    try {
      const co = await api("/api/company");
      const filled = Number((co.progress && co.progress.filled) || 0);
      const total = Number((co.progress && co.progress.total) || 5);
      const meta = ring.querySelector(".dept-ring-meta");
      if (!meta) return;
      let line = meta.querySelector(".dept-ring-continue");
      if (!line) {
        line = document.createElement("span");
        line.className = "muted dept-ring-continue";
        const dots = meta.querySelector(".dept-dots");
        if (dots) meta.insertBefore(line, dots);
        else meta.appendChild(line);
      }
      if (filled >= total) {
        line.textContent = "五部门已齐 · 可随时回看";
      } else {
        line.textContent = filled + "/" + total + " · 可继续盘点";
      }
      let cta = ring.querySelector("#homeDeptRingCta");
      if (!cta) {
        cta = document.createElement("button");
        cta.type = "button";
        cta.id = "homeDeptRingCta";
        cta.className = "btn ghost sm home-dept-ring-cta";
        cta.textContent = filled >= total ? "去回看" : "继续盘点";
        ring.appendChild(cta);
        cta.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof show === "function") show("company");
        });
      } else {
        cta.textContent = filled >= total ? "去回看" : "继续盘点";
      }
    } catch (_) {}
  }

  /* 2 · 交割批量清除照片/聊天 */
  function ensureBatchClearMediaBar() {
    const batch = $("#lgBatchBar");
    if (!batch || $("#lgBatchClearMediaBar")) return;
    const bar = document.createElement("div");
    bar.id = "lgBatchClearMediaBar";
    bar.className = "lg-batch-clear-media-bar";
    bar.innerHTML = `<h3 class="lg-batch-clear-title">批量清除照片 / 聊天</h3>
      <p class="muted">勾选条目后，一键标上清除照片与聊天（演示）。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px">
        <button type="button" class="btn sm" id="lgBatchClearMediaOn">勾选清除照片与聊天</button>
        <button type="button" class="btn ghost sm" id="lgBatchClearMediaOff">清除标记</button>
      </div>`;
    const factory = $("#lgBatchFactoryBar");
    if (factory && factory.parentNode) factory.insertAdjacentElement("afterend", bar);
    else {
      const bene = $("#lgBatchBeneBar");
      if (bene && bene.parentNode) bene.insertAdjacentElement("afterend", bar);
      else batch.insertAdjacentElement("afterend", bar);
    }

    async function run(on) {
      const ids = $$("#lgList .lg-check:checked").map((c) => Number(c.dataset.id));
      if (!ids.length) {
        softBanner("请先勾选要处理的交割条目", "legacy");
        toast("请先勾选条目");
        return;
      }
      try {
        const r = await api("/api/legacy/batch-clear-media", {
          method: "POST",
          body: JSON.stringify({
            ids,
            clear_photos: !!on,
            clear_chats: !!on,
          }),
        });
        softBanner(
          r.note || (on ? "已标清除照片与聊天" : "已清除标记"),
          "legacy"
        );
        toast(r.note || "已更新");
        if (typeof refreshLegacy === "function") await refreshLegacy();
      } catch (e) {
        toast(e.message || "未完成");
      }
    }
    $("#lgBatchClearMediaOn").onclick = () => run(true);
    $("#lgBatchClearMediaOff").onclick = () => run(false);
  }

  /* 3 · 备忘平台名自动大写首字母（可撤销） */
  function bindPlatformCapitalize() {
    const input = $("#asPlatform");
    if (!input || input.dataset.r25cap) return;
    input.dataset.r25cap = "1";
    input.addEventListener("blur", () => {
      const prev = input.value || "";
      const next = capitalizePlatform(prev);
      if (next === prev || !next.trim()) return;
      PLATFORM_UNDO.prev = prev;
      input.value = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      softBanner("已温和规范平台名首字母", "assets", [
        {
          label: "撤销",
          onClick: () => {
            input.value = PLATFORM_UNDO.prev;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            softBanner("已撤销平台名规范化", "assets");
            toast("已撤销");
          },
        },
      ]);
      toast("已规范首字母");
    });
  }

  /* 4 · 报备成功震动/轻反馈可选（默认关） */
  function hapticEnabled() {
    return localStorage.getItem(HAPTIC_KEY) === "1";
  }

  function maybeCheckinHaptic() {
    if (!hapticEnabled()) return;
    try {
      if (navigator.vibrate) navigator.vibrate(14);
    } catch (_) {}
  }

  function patchCheckinHaptic() {
    if (window._r25QuickPatched) return;
    const orig =
      typeof window.doQuickCheckin === "function"
        ? window.doQuickCheckin
        : typeof doQuickCheckin === "function"
        ? doQuickCheckin
        : null;
    if (!orig || orig._r25haptic) {
      if (orig && orig._r25haptic) window._r25QuickPatched = true;
      return;
    }
    const wrapped = async function () {
      await orig.apply(this, arguments);
      maybeCheckinHaptic();
    };
    wrapped._r25haptic = true;
    window.doQuickCheckin = wrapped;
    try {
      doQuickCheckin = wrapped;
    } catch (_) {}
    window._r25QuickPatched = true;
  }

  function ensureHapticToggle() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#checkinHapticCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHapticCard";
      card.className = "card checkin-haptic-card";
      const large = box.querySelector("#largeTextToggle");
      const largeCard = large && large.closest(".card");
      if (largeCard && largeCard.parentNode) {
        largeCard.insertAdjacentElement("afterend", card);
      } else {
        box.appendChild(card);
      }
    }
    const on = hapticEnabled();
    card.innerHTML = `<h3>报备轻反馈</h3>
      <p class="muted">本机偏好。开启后，报备成功时尽量轻震一下（无震动能力则静默）。</p>
      <label class="row large-toggle"><input type="checkbox" id="checkinHapticToggle" ${
        on ? "checked" : ""
      }/> <span>报备成功轻反馈（默认关）</span></label>`;
    const toggle = $("#checkinHapticToggle");
    if (toggle) {
      toggle.onchange = () => {
        localStorage.setItem(HAPTIC_KEY, toggle.checked ? "1" : "0");
        softBanner(
          toggle.checked ? "已开启报备轻反馈" : "已关闭报备轻反馈",
          "settings"
        );
        toast(toggle.checked ? "已开启" : "已关闭");
      };
    }
  }

  /* 5 · 会员页权益三行与今日卡对齐 */
  async function paintMemberBenefitsAligned() {
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
      const [bene, today, tf] = await Promise.all([
        api("/api/membership/benefits"),
        api("/api/today").catch(() => ({ items: [] })),
        api("/api/travel-fund").catch(() => ({ fund: {} })),
      ]);
      const rows = bene.rows || [];
      const todayItems = today.items || [];
      const todayCk = todayItems.find((x) => x.key === "checkin") || {};
      const fund = tf.fund || tf;
      const thr = Number(fund.threshold || 2000);
      const bal = Number(fund.balance || 0);
      const travelMet = !!(fund.meets_threshold || fund.met || bal >= thr);

      const aligned = rows.map((r) => {
        const row = Object.assign({}, r);
        if (row.key === "checkin" && todayCk.detail) {
          row.detail = todayCk.detail;
          if (typeof todayCk.done === "boolean") row.ready = !!todayCk.done;
        }
        if (row.key === "travel") {
          row.ready = travelMet;
          row.detail = travelMet
            ? "差旅预存已达建议门槛（≥¥" + thr.toFixed(0) + "）"
            : "差旅预存对照：当前 ¥" + bal.toFixed(0) + " · 建议门槛 ¥" + thr.toFixed(0);
        }
        return row;
      });

      card.innerHTML = `<h3>会员权益对照</h3>
        <p class="muted">与首页今日卡同口径：报备 / 差旅 / 手册三态只读对齐。</p>
        <div class="benefit-rows benefit-rows-today" id="memberBenefitsAligned">${aligned
          .map(
            (r) => `<div class="todo-item benefit-todo ${r.ready ? "done" : ""}" data-benefit="${esc(
              r.key || ""
            )}">
            <span class="todo-mark">${r.ready ? "就绪" : "待补"}</span>
            <button type="button" class="todo-go" data-go="${esc(r.go || "member")}">
              <span class="todo-body">
                <strong>${esc(r.label || "")}</strong>
                <span class="muted">${esc(r.detail || "")}</span>
              </span>
              <span class="todo-arrow" aria-hidden="true">→</span>
            </button>
          </div>`
          )
          .join("")}</div>
        <p class="muted">${esc(bene.text || "")}</p>`;
      $$("#memberBenefitsAligned .todo-go").forEach((btn) => {
        btn.onclick = () => {
          const go = btn.dataset.go || "member";
          if (typeof show === "function") show(go);
        };
      });
    } catch (e) {
      card.innerHTML = `<h3>会员权益对照</h3><p class="muted">暂不可用：${esc(
        e.message || ""
      )}</p>`;
    }
  }

  /* 6 · 差旅断缴退款状态只读卡强化 */
  async function enhanceTravelRefundCard() {
    const box = $("#travelBox");
    if (!box) return;
    try {
      const { fund } = await api("/api/travel-fund");
      const last = fund && fund.last_refund;
      let card = $("#travelLastRefundCard");
      if (!last) {
        if (card) card.classList.remove("travel-last-refund-strong");
        return;
      }
      if (!card) {
        card = document.createElement("div");
        card.id = "travelLastRefundCard";
        card.className = "card travel-last-refund";
        const first = box.querySelector(".card");
        if (first && first.nextSibling) box.insertBefore(card, first.nextSibling);
        else box.appendChild(card);
      }
      card.classList.add("travel-last-refund-strong");
      const amt =
        typeof fmtMoney === "function"
          ? fmtMoney(Math.abs(last.amount))
          : "¥" + Math.abs(Number(last.amount) || 0).toFixed(0);
      const when = typeof fmtTime === "function" ? fmtTime(last.created_at) : "";
      card.innerHTML = `<div class="travel-refund-head">
          <h3>最近一笔退款（只读）</h3>
          <span class="tag travel-refund-tag">已退回 · 只读</span>
        </div>
        <p class="muted">断缴后原路退回的温和回显。流程本身未改，按自己节奏查看即可。</p>
        <div class="stat" style="margin-top:10px">
          <div class="box"><span class="muted">金额</span><b style="font-size:16px">${esc(
            amt
          )}</b></div>
          <div class="box"><span class="muted">时间</span><b style="font-size:14px">${esc(
            when || "—"
          )}</b></div>
        </div>
        <p class="muted travel-refund-note" style="margin-top:8px">${esc(
          last.note || "已原路退回 · 无需操作"
        )}</p>`;
    } catch (_) {}
  }

  /* 7 · 善后工单复制摘要 */
  async function ensureAftercareCopySummary() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#acList .item");
    nodes.forEach((el, i) => {
      const it = items[i] || {};
      if (it.id) el.dataset.id = String(it.id);
      if (it.city) el.dataset.city = String(it.city);
      if (it.title) el.dataset.title = String(it.title);
      if (it.travel_budget != null) el.dataset.budget = String(it.travel_budget);
      if (el.querySelector(".ac-copy-summary")) return;
      const title =
        it.title ||
        el.dataset.title ||
        ((el.querySelector("strong") || {}).textContent || "").trim() ||
        "善后工单";
      const city = it.city || el.dataset.city || "未填城市";
      const budget =
        it.travel_budget != null
          ? it.travel_budget
          : el.dataset.budget != null
          ? el.dataset.budget
          : "";
      const budgetLabel =
        typeof fmtMoney === "function"
          ? fmtMoney(budget || 0)
          : "¥" + Number(budget || 0).toFixed(0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-summary";
      btn.textContent = "复制摘要";
      btn.onclick = async () => {
        const blob = [title, city, "预算 " + budgetLabel].join(" · ");
        const ok = await copyText(blob);
        softBanner(ok ? "已复制工单摘要" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 8 · 授权视频门槛齐备庆祝条 */
  async function paintAuthGateCelebrate() {
    const panel = $("#authvideo");
    if (!panel) return;
    let bar = $("#avGateCelebrateBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "avGateCelebrateBar";
      bar.className = "av-gate-celebrate-bar";
      bar.setAttribute("role", "status");
      const status = $("#avStatus");
      if (status && status.parentNode) status.insertAdjacentElement("afterend", bar);
      else {
        const script = $("#authScript");
        if (script && script.parentNode) script.parentNode.insertBefore(bar, script);
        else panel.insertBefore(bar, panel.firstChild);
      }
    }
    try {
      const st = await api("/api/auth-video");
      const ready = !!(st.ready || st.complete);
      if (!ready) {
        bar.hidden = true;
        bar.innerHTML = "";
        return;
      }
      bar.hidden = false;
      bar.innerHTML = `<span class="av-gate-celebrate-mark">门槛已齐</span>
        <span class="muted av-gate-celebrate-sub">可开善后 · 按自己的节奏即可</span>
        <button type="button" class="btn ghost sm" id="avGateCelebrateGo">去善后</button>`;
      const btn = $("#avGateCelebrateGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("aftercare");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 9 · 手册导出前再次确认条数 */
  function bindExportCountConfirm() {
    const box = $("#handoverBox");
    if (!box || box.dataset.r25export) return;
    box.dataset.r25export = "1";
    box.addEventListener(
      "click",
      async (e) => {
        const a = e.target.closest('a[href*="handover.html"], a[href*="export/pack"]');
        if (!a) return;
        e.preventDefault();
        e.stopPropagation();
        let n = 0;
        try {
          const hand = await api("/api/handover");
          n =
            hand.item_count != null
              ? Number(hand.item_count)
              : (hand.todos || []).length;
        } catch (_) {
          n = 0;
        }
        const ok = await calmConfirm({
          title: "确认导出手册？",
          body:
            "本次将导出 " +
            n +
            " 条交割安排。打开打印页后可另存或打印，按自己节奏即可。",
          okLabel: "打开导出",
        });
        if (!ok) {
          softBanner("已取消导出 · 条数 " + n, "handover");
          return;
        }
        softBanner("即将打开导出 · 共 " + n + " 条", "handover");
        const href = a.getAttribute("href");
        if (href) window.open(href, "_blank", "noopener");
      },
      true
    );
  }

  /* 10 · 设置·版本与 round 层清单 */
  function paintRoundLayerList() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#roundLayerListCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "roundLayerListCard";
      card.className = "card round-layer-list-card";
      box.appendChild(card);
    }
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 25;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 25); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（只读）。</p>
      <p class="round-layer-summary"><strong>已加载</strong> round${
        loaded.length ? loaded[0] : "—"
      }…round${loaded.length ? loaded[loaded.length - 1] : "—"}
        · 共 ${loaded.length} 层</p>
      <div class="round-layer-chips" role="list">${loaded
        .map(
          (n) =>
            `<span class="tag round-layer-chip" role="listitem">round${n}</span>`
        )
        .join("")}</div>
      ${
        missing.length
          ? `<p class="muted" style="margin-top:8px">未检测到：${missing
              .map((n) => "round" + n)
              .join("、")}</p>`
          : `<p class="muted" style="margin-top:8px">round6…round25 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => enhanceHomeDeptRing().catch(() => {}), 60);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(ensureBatchClearMediaBar, 40);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(bindPlatformCapitalize, 40);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(patchCheckinHaptic, 40);
  };

  const _refreshMember = window.refreshMember;
  window.refreshMember = async function () {
    await _refreshMember();
    setTimeout(() => paintMemberBenefitsAligned().catch(() => {}), 40);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => enhanceTravelRefundCard().catch(() => {}), 60);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareCopySummary().catch(() => {}), 60);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => paintAuthGateCelebrate().catch(() => {}), 40);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(bindExportCountConfirm, 40);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => enhanceHomeDeptRing().catch(() => {}), 80);
    if (id === "legacy") setTimeout(ensureBatchClearMediaBar, 60);
    if (id === "assets") setTimeout(bindPlatformCapitalize, 40);
    if (id === "checkin") setTimeout(patchCheckinHaptic, 60);
    if (id === "member")
      setTimeout(() => paintMemberBenefitsAligned().catch(() => {}), 60);
    if (id === "travel")
      setTimeout(() => enhanceTravelRefundCard().catch(() => {}), 80);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareCopySummary().catch(() => {}), 80);
    if (id === "authvideo")
      setTimeout(() => paintAuthGateCelebrate().catch(() => {}), 60);
    if (id === "handover") setTimeout(bindExportCountConfirm, 60);
    if (id === "settings") {
      setTimeout(() => {
        ensureHapticToggle();
        paintRoundLayerList();
      }, 100);
      setTimeout(() => {
        ensureHapticToggle();
        paintRoundLayerList();
      }, 380);
    }
  };

  // Boot
  patchCheckinHaptic();
  bindPlatformCapitalize();
  setTimeout(() => enhanceHomeDeptRing().catch(() => {}), 120);
  ensureBatchClearMediaBar();
  if ($("#member") && $("#member").classList.contains("active")) {
    paintMemberBenefitsAligned().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    enhanceTravelRefundCard().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCopySummary().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    paintAuthGateCelebrate().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    bindExportCountConfirm();
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      ensureHapticToggle();
      paintRoundLayerList();
    }, 120);
  }
})();
