/* 电子继承 · 第三十二批增量（叠在 round31…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round32SoftBanner_" + (hostId || "home");
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

  function fmtMoneyLocal(n) {
    if (typeof fmtMoney === "function") return fmtMoney(n);
    const v = Number(n);
    if (Number.isNaN(v)) return String(n || "");
    return "¥" + v;
  }

  function authMissingLabels(st) {
    if (st.ready) return [];
    const latest = st.latest || (st.items || [])[0] || {};
    const miss = [];
    if (!latest.has_greeting) miss.push("问候");
    if (!latest.has_authorize) miss.push("授权");
    if (!latest.has_plan) miss.push("思路");
    return miss;
  }

  /* 1 · 首页授权视频门槛就绪一句 */
  async function paintHomeAuthGate() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAuthGateBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAuthGateBar";
      bar.className = "home-auth-gate-bar";
      bar.setAttribute("role", "status");
      const as = $("#homeAssetsCountBar");
      const lg = $("#homeLegacyCountBar");
      if (as && as.parentNode === home) as.insertAdjacentElement("afterend", bar);
      else if (lg && lg.parentNode === home) lg.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/auth-video");
      bar.hidden = false;
      if (st.ready) {
        bar.innerHTML = `<span class="home-av-mark">授权视频</span>
          <span class="muted home-av-sub">门槛已齐 · 可开善后</span>
          <button type="button" class="btn ghost sm" id="homeAuthGateGo">去善后</button>`;
        const btn = $("#homeAuthGateGo");
        if (btn) {
          btn.onclick = () => {
            if (typeof show === "function") show("aftercare");
          };
        }
      } else {
        const miss = authMissingLabels(st);
        const sub = miss.length
          ? "还可补 · 缺 " + miss.join("、")
          : "可去补录 · 按自己节奏即可";
        bar.innerHTML = `<span class="home-av-mark">授权视频</span>
          <span class="muted home-av-sub">${esc(sub)}</span>
          <button type="button" class="btn ghost sm" id="homeAuthGateGo">去补录</button>`;
        const btn = $("#homeAuthGateGo");
        if (btn) {
          btn.onclick = () => {
            if (typeof show === "function") show("authvideo");
          };
        }
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割当前可见条数回显 */
  function paintLegacyVisibleCount() {
    const list = $("#lgList");
    if (!list || !list.parentNode) return;
    let bar = $("#lgVisibleCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "lgVisibleCountBar";
      bar.className = "muted lg-visible-count";
      bar.setAttribute("role", "status");
      list.parentNode.insertBefore(bar, list);
    }
    const items = $$("#lgList .item[data-id], #lgList .item").filter((el) =>
      el.querySelector("strong")
    );
    const visible = items.filter((el) => !el.hidden);
    bar.textContent = "当前可见 " + visible.length + " 条 · 只读";
  }

  function bindLegacyVisibleCountObserver() {
    const list = $("#lgList");
    if (!list || list.dataset.r32vis) return;
    list.dataset.r32vis = "1";
    const mo = new MutationObserver(() => paintLegacyVisibleCount());
    mo.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "class", "style"],
    });
    paintLegacyVisibleCount();
  }

  /* 3 · 备忘平台名一键复制 */
  async function ensureAssetPlatformCopyButtons() {
    const list = $("#asList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/assets");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#asList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      const platform = it ? String(it.platform || "").trim() : "";
      if (it) el.dataset.platform = platform;
      if (!platform || el.querySelector(".as-copy-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform";
      btn.textContent = "复制平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platform || "");
        softBanner(ok ? "已复制备忘平台名" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔+冷静期组合说明 */
  function ensureCheckinComboCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    const interval = $("#intervalHours");
    const grace = $("#graceHours");
    if (!interval && !grace) return;
    let card = $("#checkinComboCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinComboCopyCard";
      card.className = "checkin-combo-copy";
      const member = $("#checkinMemberCopyCard");
      const backup = $("#checkinBackupCopyCard");
      if (member && member.parentNode) member.insertAdjacentElement("afterend", card);
      else if (backup && backup.parentNode) backup.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    const iv = Number((interval && interval.value) || 24) || 24;
    const gh = Number((grace && grace.value) || 72);
    const g = Number.isFinite(gh) ? gh : 72;
    const line =
      "报备间隔 " + iv + " 小时 · 冷静期 " + g + " 小时（电子继承 · 演示说明，不改外呼流程）";
    card.innerHTML = `<p class="muted checkin-combo-copy-line">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="checkinComboCopyBtn">复制间隔与冷静期</button>`;
    const btn = $("#checkinComboCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const iv2 = Number(($("#intervalHours") && $("#intervalHours").value) || iv) || 24;
        const gh2 = Number(($("#graceHours") && $("#graceHours").value) || g);
        const g2 = Number.isFinite(gh2) ? gh2 : 72;
        const text =
          "报备间隔 " +
          iv2 +
          " 小时 · 冷静期 " +
          g2 +
          " 小时（电子继承 · 演示说明，不改外呼流程）";
        const ok = await copyText(text);
        softBanner(ok ? "已复制间隔与冷静期说明" : "复制未完成", "checkin");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  /* 5 · 差旅门槛达标状态一键复制 */
  async function ensureTravelThresholdCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdCopyCard";
      card.className = "travel-threshold-copy";
      const ledgerCopy = $("#travelLedgerCopyCard");
      const bal = $("#travelBalanceCopyCard");
      if (ledgerCopy && ledgerCopy.parentNode) {
        ledgerCopy.insertAdjacentElement("afterend", card);
      } else if (bal && bal.parentNode) bal.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const bal = Number(fund.balance || 0);
      const met = !!(fund.meets_threshold || fund.met || bal >= thr);
      const line = met
        ? "差旅预存已达建议门槛（余额 ¥" + bal + " · 门槛 ¥" + thr + "）"
        : "差旅预存还可补足（余额 ¥" + bal + " · 还差 ¥" + Math.max(0, Math.ceil(thr - bal)) + "）";
      card.innerHTML = `<p class="muted travel-threshold-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdCopyBtn">复制门槛状态</button>`;
      const btn = $("#travelThresholdCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制差旅门槛状态" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛状态暂不可用</p>`;
    }
  }

  /* 6 · 善后预算金额一键复制 */
  async function ensureAftercareBudgetCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    $$("#acList .item").forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      el.dataset.budget = String(it.travel_budget != null ? it.travel_budget : "");
      if (el.querySelector(".ac-copy-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget";
      btn.textContent = "复制预算";
      btn.onclick = async () => {
        const raw = el.dataset.budget;
        const text = raw !== "" ? fmtMoneyLocal(raw) : "未填预算";
        const ok = await copyText(text);
        softBanner(ok ? "已复制工单预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频三勾缺项摘要复制 */
  async function ensureAuthMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCopyCard";
      card.className = "av-missing-copy";
      const hist = $("#avHistoryCountBar");
      const pct = $("#avGatePercentBar");
      if (hist && hist.parentNode) hist.insertAdjacentElement("afterend", card);
      else if (pct && pct.parentNode) pct.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const miss = authMissingLabels(st);
      const line = st.ready
        ? "授权视频三勾已齐（电子继承 · 演示）"
        : "授权视频还缺：" + (miss.length ? miss.join("、") : "待补录") + "（电子继承 · 演示）";
      card.innerHTML = `<p class="muted av-missing-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avMissingCopyBtn">复制三勾摘要</button>`;
      const btn = $("#avMissingCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制三勾摘要" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">三勾摘要暂不可用</p>`;
    }
  }

  /* 8 · 受益人名单条数只读条 */
  async function paintHeirTotalCount() {
    const box = $("#heirsBox");
    if (!box) return;
    let bar = $("#bnTotalCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bnTotalCountBar";
      bar.className = "bn-total-count-bar";
      bar.setAttribute("role", "status");
      const roleCounts = $("#bnRoleCountsBar");
      const chips = $("#bnRoleChipBar");
      if (roleCounts && roleCounts.parentNode) {
        roleCounts.insertAdjacentElement("beforebegin", bar);
      } else if (chips && chips.parentNode) chips.insertAdjacentElement("beforebegin", bar);
      else {
        const card = box.querySelector(".card");
        if (card) {
          const h3 = card.querySelector("h3");
          if (h3) h3.insertAdjacentElement("afterend", bar);
          else card.insertBefore(bar, card.firstChild);
        } else box.insertBefore(bar, box.firstChild);
      }
    }
    try {
      const data = await api("/api/beneficiaries");
      const n = (data.items || []).length;
      bar.innerHTML = `<span class="bn-total-mark">名单人数</span>
        <span class="muted">共 ${n} 位 · 只读</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">名单人数暂不可用</span>`;
    }
  }

  /* 9 · 手册完成度百分比只读 */
  async function paintHandoverProgressPct() {
    const box = $("#handoverBox");
    if (!box) return;
    let bar = $("#handProgressPctBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "handProgressPctBar";
      bar.className = "hand-progress-pct-bar";
      bar.setAttribute("role", "status");
      const brand = $("#handBrandCopyCard");
      const todo = $("#handTodoCountBar");
      if (brand && brand.parentNode) brand.insertAdjacentElement("afterend", bar);
      else if (todo && todo.parentNode) todo.insertAdjacentElement("afterend", bar);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", bar);
        else box.insertBefore(bar, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct = Number(prog.pct != null ? prog.pct : 0);
      const filled = prog.filled_types != null ? prog.filled_types : "—";
      const total = prog.total_types != null ? prog.total_types : "—";
      bar.innerHTML = `<span class="hand-prog-mark">完成度</span>
        <span class="muted">${esc(String(pct))}% · 处置类型 ${esc(
        String(filled)
      )}/${esc(String(total))} · 只读</span>`;
    } catch (_) {
      bar.innerHTML = `<span class="muted">完成度暂不可用</span>`;
    }
  }

  /* 10 · 设置·一键复制英文品牌行 + round 层含 32 */
  function paintEnBrandCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#enBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "enBrandCopyCard";
      card.className = "card en-brand-copy-card";
      const privacy = $("#privacyPathCopyCard");
      const range = $("#roundRangeCopyCard");
      const roundList = $("#roundLayerListCard");
      if (privacy && privacy.parentNode) privacy.insertAdjacentElement("beforebegin", card);
      else if (range && range.parentNode) range.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    const line = "E-Inherit · einherit.cn";
    card.innerHTML = `<h3>英文品牌行</h3>
      <p class="muted">一键复制英文品牌与域名（演示级）。</p>
      <p class="en-brand-copy-preview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="enBrandCopyBtn">复制英文品牌行</button>`;
    const btn = $("#enBrandCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制英文品牌行" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList32() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 32;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 32); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round32 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAuthGate().catch(() => {}), 140);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => {
      bindLegacyVisibleCountObserver();
      paintLegacyVisibleCount();
    }, 80);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetPlatformCopyButtons().catch(() => {}), 70);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(ensureCheckinComboCopy, 70);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelThresholdCopy().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareBudgetCopyButtons().catch(() => {}), 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthMissingCopy().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => paintHeirTotalCount().catch(() => {}), 80);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => paintHandoverProgressPct().catch(() => {}), 90);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeAuthGate().catch(() => {}), 150);
    if (id === "legacy") {
      setTimeout(() => {
        bindLegacyVisibleCountObserver();
        paintLegacyVisibleCount();
      }, 100);
    }
    if (id === "assets") setTimeout(() => ensureAssetPlatformCopyButtons().catch(() => {}), 80);
    if (id === "checkin") setTimeout(ensureCheckinComboCopy, 90);
    if (id === "travel") setTimeout(() => ensureTravelThresholdCopy().catch(() => {}), 110);
    if (id === "aftercare") setTimeout(() => ensureAftercareBudgetCopyButtons().catch(() => {}), 100);
    if (id === "authvideo") setTimeout(() => ensureAuthMissingCopy().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => paintHeirTotalCount().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => paintHandoverProgressPct().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintEnBrandCopyCard();
        paintRoundLayerList32();
      }, 140);
      setTimeout(() => {
        paintEnBrandCopyCard();
        paintRoundLayerList32();
      }, 460);
    }
  };

  // Boot
  setTimeout(() => paintHomeAuthGate().catch(() => {}), 200);
  setTimeout(() => {
    bindLegacyVisibleCountObserver();
    paintLegacyVisibleCount();
  }, 220);
  setTimeout(() => ensureAssetPlatformCopyButtons().catch(() => {}), 240);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinComboCopy();
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    paintHeirTotalCount().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    paintHandoverProgressPct().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintEnBrandCopyCard();
      paintRoundLayerList32();
    }, 160);
  }
})();
