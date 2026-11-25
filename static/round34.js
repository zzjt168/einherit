/* 电子继承 · 第三十四批增量（叠在 round33…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round34SoftBanner_" + (hostId || "home");
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

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function formatTs(ts) {
    const t = parseTs(ts);
    if (!t) return "";
    if (typeof fmtTime === "function") return fmtTime(t);
    try {
      return new Date(t * 1000).toLocaleString();
    } catch (_) {
      return String(ts);
    }
  }

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    return shortMap[dept] || nameMap[dept] || String(dept || "");
  }

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();
    if (r === "heir") return "继承人";
    if (r === "family") return "家人";
    if (r === "executor") return "执行人";
    return String(role || "");
  }

  /* 1 · 首页差旅门槛达标一句 */
  async function paintHomeTravelThreshold() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeTravelThresholdBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeTravelThresholdBar";
      bar.className = "home-travel-threshold-bar";
      bar.setAttribute("role", "status");
      const mb = $("#homeMemberStatusBar");
      const av = $("#homeAuthGateBar");
      if (mb && mb.parentNode === home) mb.insertAdjacentElement("afterend", bar);
      else if (av && av.parentNode === home) av.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr = Number(fund.threshold != null ? fund.threshold : 2000);
      const bal = Number(fund.balance || 0);
      const met = !!(fund.meets_threshold || fund.met || bal >= thr);
      bar.hidden = false;
      if (met) {
        bar.innerHTML = `<span class="home-tf-mark">差旅预存</span>
          <span class="muted home-tf-sub">已达建议门槛 · 余额 ¥${bal}</span>
          <button type="button" class="btn ghost sm" id="homeTravelGo">去差旅</button>`;
      } else {
        const need = Math.max(0, Math.ceil(thr - bal));
        bar.innerHTML = `<span class="home-tf-mark">差旅预存</span>
          <span class="muted home-tf-sub">还可补足 · 还差 ¥${need}</span>
          <button type="button" class="btn ghost sm" id="homeTravelGo">去差旅</button>`;
      }
      const btn = $("#homeTravelGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("travel");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割部门一键复制 */
  async function ensureLegacyDeptCopyButtons() {
    const list = $("#lgList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/legacy");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      const label = it ? deptLabel(it.dept) || String(it.dept || "") : "";
      if (it) el.dataset.deptLabel = label;
      if (!label || el.querySelector(".lg-copy-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept";
      btn.textContent = "复制部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptLabel || "");
        softBanner(ok ? "已复制交割部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置指引一键复制 */
  async function ensureAssetDisposeCopyButtons() {
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
      const note = it ? String(it.dispose_note || "").trim() : "";
      if (it) el.dataset.disposeNote = note;
      let btn = el.querySelector(".as-copy-dispose");
      if (!note) {
        if (btn) btn.remove();
        return;
      }
      if (btn) return;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose";
      btn.textContent = "复制处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeNote || "");
        softBanner(ok ? "已复制备忘处置指引" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次与下次组合行 */
  async function ensureCheckinLastNextCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastNextCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastNextCopyCard";
      card.className = "checkin-last-next-copy";
      const due = $("#checkinDueCopyCard");
      const combo = $("#checkinComboCopyCard");
      if (due && due.parentNode) due.insertAdjacentElement("afterend", card);
      else if (combo && combo.parentNode) combo.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    try {
      const st = await api("/api/checkin/status");
      const user = st.user || {};
      const last = formatTs(user.last_checkin_at || user.last_checkin || "");
      const next = formatTs(user.checkin_due_at || user.next_checkin_at || "");
      let line = "电子继承报备节点（只读演示）";
      if (last && next) line = "上次报备 · " + last + " · 下次建议 · " + next;
      else if (last) line = "上次报备 · " + last;
      else if (next) line = "下次建议 · " + next;
      else line = "报备节点暂不可用";
      card.innerHTML = `<p class="muted checkin-last-next-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinLastNextCopyBtn" ${
          last || next ? "" : "disabled"
        }>复制上次与下次</button>`;
      const btn = $("#checkinLastNextCopyBtn");
      if (btn && (last || next)) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制上次与下次节点" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备节点暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额数字一键复制 */
  async function ensureTravelBalanceNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceNumCopyCard";
      card.className = "travel-balance-num-copy";
      const amt = $("#travelThresholdAmtCopyCard");
      const thr = $("#travelThresholdCopyCard");
      const bal = $("#travelBalanceCopyCard");
      if (amt && amt.parentNode) amt.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode) thr.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode) bal.insertAdjacentElement("afterend", card);
      else box.insertBefore(card, box.firstChild);
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal = Number(fund.balance || 0);
      const line = "¥" + bal;
      card.innerHTML = `<p class="muted travel-balance-num-copy-line">当前余额 ${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceNumCopyBtn">复制余额数字</button>`;
      const btn = $("#travelBalanceNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制差旅余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额暂不可用</p>`;
    }
  }

  /* 6 · 善后当前可见条数回显 */
  function paintAftercareVisibleCount() {
    const list = $("#acList");
    if (!list || !list.parentNode) return;
    let bar = $("#acVisibleCountBar");
    if (!bar) {
      bar = document.createElement("p");
      bar.id = "acVisibleCountBar";
      bar.className = "muted ac-visible-count";
      bar.setAttribute("role", "status");
      list.parentNode.insertBefore(bar, list);
    }
    const items = $$("#acList .item").filter((el) => el.querySelector("strong"));
    const visible = items.filter((el) => !el.hidden);
    bar.textContent = "当前可见 " + visible.length + " 单 · 只读";
  }

  function bindAftercareVisibleCountObserver() {
    const list = $("#acList");
    if (!list || list.dataset.r34vis) return;
    list.dataset.r34vis = "1";
    const mo = new MutationObserver(() => paintAftercareVisibleCount());
    mo.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "class", "style"],
    });
    paintAftercareVisibleCount();
  }

  /* 7 · 授权视频就绪状态一键复制 */
  async function ensureAuthReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCopyCard";
      card.className = "av-ready-copy";
      const seg = $("#avScriptSegCount");
      const miss = $("#avMissingCopyCard");
      if (seg && seg.parentNode) seg.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode) miss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const line = st.ready
        ? "授权视频门槛已齐（电子继承 · 演示）"
        : "授权视频门槛未齐 · 可去补录（电子继承 · 演示）";
      card.innerHTML = `<p class="muted av-ready-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avReadyCopyBtn">复制就绪状态</button>`;
      const btn = $("#avReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制授权视频就绪状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色一键复制 */
  async function ensureHeirRoleCopyButtons() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#heirsBox .item").filter((el) => el.querySelector("strong"));
    nodes.forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      if (it.id != null) el.dataset.id = String(it.id);
      const label = roleLabel(it.role);
      el.dataset.roleLabel = label;
      if (!label || el.querySelector(".bn-copy-role")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role";
      btn.textContent = "复制角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleLabel || "");
        softBanner(ok ? "已复制受益人角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册执行人+域名组合复制 */
  async function ensureHandoverExecutorDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExecutorDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExecutorDomainCopyCard";
      card.className = "hand-executor-domain-copy";
      const exportPath = $("#handExportPathCopyCard");
      const prog = $("#handProgressPctBar");
      if (exportPath && exportPath.parentNode) {
        exportPath.insertAdjacentElement("afterend", card);
      } else if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const name = String(data.executor || "").trim() || "未指定";
      const domain = String(data.domain || "einherit.cn").trim();
      const line = "执行人 · " + name + " · " + domain;
      card.innerHTML = `<p class="muted hand-executor-domain-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handExecutorDomainCopyBtn">复制执行人与域名</button>`;
      const btn = $("#handExecutorDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制执行人与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">执行人与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制服务端版本行 + round 层含 34 */
  async function paintServerVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverVersionCopyCard";
      card.className = "card server-version-copy-card";
      const zhEn = $("#zhEnBrandCopyCard");
      const en = $("#enBrandCopyCard");
      const roundList = $("#roundLayerListCard");
      if (zhEn && zhEn.parentNode) zhEn.insertAdjacentElement("beforebegin", card);
      else if (en && en.parentNode) en.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const line =
        (h.server_version || "EInherit") +
        " · v" +
        (h.version || "?") +
        " · " +
        (h.domain || "einherit.cn");
      card.innerHTML = `<h3>服务端版本</h3>
        <p class="muted">一键复制服务端版本行（演示级）。</p>
        <p class="server-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverVersionCopyBtn">复制服务端版本行</button>`;
      const btn = $("#serverVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务端版本行" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端版本</h3><p class="muted">版本信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList34() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 34;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 34); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round34 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeTravelThreshold().catch(() => {}), 160);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyDeptCopyButtons().catch(() => {}), 80);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetDisposeCopyButtons().catch(() => {}), 80);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinLastNextCopy().catch(() => {}), 70);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceNumCopy().catch(() => {}), 90);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => {
      bindAftercareVisibleCountObserver();
      paintAftercareVisibleCount();
    }, 80);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthReadyCopy().catch(() => {}), 50);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleCopyButtons().catch(() => {}), 80);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExecutorDomainCopy().catch(() => {}), 90);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeTravelThreshold().catch(() => {}), 170);
    if (id === "legacy") setTimeout(() => ensureLegacyDeptCopyButtons().catch(() => {}), 100);
    if (id === "assets") setTimeout(() => ensureAssetDisposeCopyButtons().catch(() => {}), 90);
    if (id === "checkin") setTimeout(() => ensureCheckinLastNextCopy().catch(() => {}), 90);
    if (id === "travel") setTimeout(() => ensureTravelBalanceNumCopy().catch(() => {}), 110);
    if (id === "aftercare") {
      setTimeout(() => {
        bindAftercareVisibleCountObserver();
        paintAftercareVisibleCount();
      }, 100);
    }
    if (id === "authvideo") setTimeout(() => ensureAuthReadyCopy().catch(() => {}), 70);
    if (id === "heirs") setTimeout(() => ensureHeirRoleCopyButtons().catch(() => {}), 90);
    if (id === "handover") setTimeout(() => ensureHandoverExecutorDomainCopy().catch(() => {}), 100);
    if (id === "settings") {
      setTimeout(() => {
        paintServerVersionCopyCard().catch(() => {});
        paintRoundLayerList34();
      }, 140);
      setTimeout(() => {
        paintServerVersionCopyCard().catch(() => {});
        paintRoundLayerList34();
      }, 460);
    }
  };

  // Boot
  setTimeout(() => paintHomeTravelThreshold().catch(() => {}), 220);
  setTimeout(() => ensureLegacyDeptCopyButtons().catch(() => {}), 240);
  setTimeout(() => ensureAssetDisposeCopyButtons().catch(() => {}), 260);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastNextCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    bindAftercareVisibleCountObserver();
    paintAftercareVisibleCount();
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExecutorDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerVersionCopyCard().catch(() => {});
      paintRoundLayerList34();
    }, 160);
  }
})();
