/* 电子继承 · 第六十批增量（里程碑；叠在 round59…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round60SoftBanner_" + (hostId || "home");
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

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    const fallback = {
      production: "生产部",
      finance: "财务部",
      ip: "知识产权部",
      admin: "行政部",
      hr: "人事部",
    };
    return (
      shortMap[dept] || nameMap[dept] || fallback[dept] || String(dept || "")
    );
  }

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
  }

  function collectRoundLayers() {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    return Array.from(new Set(found)).sort((a, b) => a - b);
  }

  /* 1 · 首页六十批体验层就绪一句 */
  function paintHomeRound60Ready() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeRound60ReadyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeRound60ReadyBar";
      bar.className = "home-round60-ready-bar";
      bar.setAttribute("role", "status");
      const r50 = $("#homeRound50ReadyBar");
      const pct = $("#homeTravelPctBar");
      const bal = $("#homeTravelBalanceBar");
      if (r50 && r50.parentNode === home)
        r50.insertAdjacentElement("afterend", bar);
      else if (pct && pct.parentNode === home)
        pct.insertAdjacentElement("afterend", bar);
      else if (bal && bal.parentNode === home)
        bal.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    const layers = collectRoundLayers();
    const has60 = layers.indexOf(60) >= 0;
    bar.hidden = false;
    if (has60) {
      bar.innerHTML = `<span class="home-round60-ready-mark">体验层</span>
        <span class="muted home-round60-ready-sub">round6…round60 已就绪 · 六十批里程碑</span>
        <button type="button" class="btn ghost sm" id="homeRound60ReadyGo">去设置</button>`;
    } else {
      bar.innerHTML = `<span class="home-round60-ready-mark">体验层</span>
        <span class="muted home-round60-ready-sub">六十批脚本待挂载 · 可去设置查看</span>
        <button type="button" class="btn ghost sm" id="homeRound60ReadyGo">去设置</button>`;
    }
    const btn = $("#homeRound60ReadyGo");
    if (btn) {
      btn.onclick = () => {
        if (typeof show === "function") show("settings");
      };
    }
  }

  /* 2 · 交割编号+出厂重置状态组合复制 */
  async function ensureLegacyIdFactoryCopyButtons() {
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
      if (!it || it.id == null) return;
      const on = !!(it.factory_reset === true || it.factory_reset === 1 || it.factory_reset === "1");
      const status = on ? "已勾出厂重置" : "未勾出厂重置";
      const line = "#" + it.id + " · " + status;
      el.dataset.idFactory = line;
      if (el.querySelector(".lg-copy-id-factory")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-factory";
      btn.textContent = "复制编号与出厂状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idFactory || "");
        softBanner(ok ? "已复制编号与出厂状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+部门组合复制 */
  async function ensureAssetVisibilityDeptCopyButtons() {
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
      if (!it) return;
      const vis = visibilityLabel(it.visibility);
      const dept = deptLabel(it.dept);
      const line = vis && dept ? vis + " · " + dept : vis || dept;
      el.dataset.visibilityDept = line;
      if (!line || el.querySelector(".as-copy-visibility-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-dept";
      btn.textContent = "复制可见性与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityDept || "");
        softBanner(ok ? "已复制可见性与部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近与下次建议时刻组合 */
  async function ensureCheckinLastNextLabelCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastNextLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastNextLabelCopyCard";
      card.className = "checkin-last-next-label-copy";
      const inGrace = $("#checkinInGraceStatusCopyCard");
      const graceSec = $("#checkinGraceRemainSecNumCopyCard");
      const last = $("#checkinLastLabelCopyCard");
      if (inGrace && inGrace.parentNode)
        inGrace.insertAdjacentElement("afterend", card);
      else if (graceSec && graceSec.parentNode)
        graceSec.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const last = String(cd.last_checkin_label || "").trim();
      const next = String(cd.next_suggested_label || "").trim();
      if (!last && !next) {
        card.innerHTML = `<p class="muted">报备时刻组合暂不可用</p>`;
        return;
      }
      const combo = last && next ? last + " · " + next : last || next;
      const line =
        "最近与下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-next-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastNextLabelCopyBtn">复制时刻组合</button>`;
      const btn = $("#checkinLastNextLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时刻组合" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时刻组合暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛与进度百分比组合复制 */
  async function ensureTravelThrPctCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThrPctCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThrPctCopyCard";
      card.className = "travel-thr-pct-copy";
      const idKind = $("#travelLedgerIdKindCopyCard");
      const combo = $("#travelLedgerKindComboCopyCard");
      const bal = $("#travelBalanceThresholdCopyCard");
      if (idKind && idKind.parentNode)
        idKind.insertAdjacentElement("afterend", card);
      else if (combo && combo.parentNode)
        combo.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode)
        bal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr = fund.threshold;
      let pct = fund.progress_pct;
      if (thr == null) {
        card.innerHTML = `<p class="muted">门槛与进度暂不可用</p>`;
        return;
      }
      if (pct == null) {
        const bal = Number(fund.balance || 0);
        pct = Math.min(100, Math.round((bal / (Number(thr) || 1)) * 100));
      }
      const combo =
        String(Math.round(Number(thr))) +
        " · " +
        String(Math.round(Number(pct)));
      const line = "差旅门槛 · 进度 · " + combo;
      card.innerHTML = `<p class="muted travel-thr-pct-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThrPctCopyBtn">复制门槛与进度</button>`;
      const btn = $("#travelThrPctCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛与进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛与进度暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+协作状态组合复制 */
  async function ensureAftercareIdCoopCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#acList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      if (!it || it.id == null) return;
      const coop = String(it.coop_state || "").trim();
      const line = coop ? "#" + it.id + " · " + coop : "#" + it.id;
      el.dataset.idCoop = line;
      if (el.querySelector(".ac-copy-id-coop")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-coop";
      btn.textContent = "复制编号与协作状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCoop || "");
        softBanner(ok ? "已复制编号与协作状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频三勾已完成/总数组合复制 */
  async function ensureAuthDoneTotalCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDoneTotalCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDoneTotalCopyCard";
      card.className = "av-done-total-copy";
      const fn = $("#avFilenamePlainCopyCard");
      const total = $("#avProgressTotalNumCopyCard");
      const done = $("#avProgressDoneNumCopyCard");
      if (fn && fn.parentNode) fn.insertAdjacentElement("afterend", card);
      else if (total && total.parentNode)
        total.insertAdjacentElement("afterend", card);
      else if (done && done.parentNode)
        done.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      if (prog.done == null || prog.total == null) {
        card.innerHTML = `<p class="muted">三勾进度组合暂不可用</p>`;
        return;
      }
      const combo =
        String(Math.round(Number(prog.done))) +
        " · " +
        String(Math.round(Number(prog.total)));
      const line = "授权视频三勾进度 · " + combo;
      card.innerHTML = `<p class="muted av-done-total-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDoneTotalCopyBtn">复制已完成与总数</button>`;
      const btn = $("#avDoneTotalCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已完成与总数" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">三勾进度暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+角色键组合复制 */
  async function ensureHeirIdRoleKeyCopyButtons() {
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
      if (!it || it.id == null) return;
      const role = String(it.role || "").trim().toLowerCase();
      const line = role ? "#" + it.id + " · " + role : "#" + it.id;
      if (el.querySelector(".bn-copy-id-role-key")) return;
      el.dataset.idRoleKey = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-role-key";
      btn.textContent = "复制编号与角色键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRoleKey || "");
        softBanner(ok ? "已复制编号与角色键" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册覆盖百分比+条目总数组合复制 */
  async function ensureHandoverPctTotalItemsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handPctTotalItemsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handPctTotalItemsCopyCard";
      card.className = "hand-pct-total-items-copy";
      const en = $("#handActionCountsEnCopyCard");
      const clear = $("#handClearCountNumCopyCard");
      const pct = $("#handProgressPctNumCopyCard");
      if (en && en.parentNode)
        en.insertAdjacentElement("afterend", card);
      else if (clear && clear.parentNode)
        clear.insertAdjacentElement("afterend", card);
      else if (pct && pct.parentNode)
        pct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let pct = prog.pct;
      let total = prog.total_items;
      if (total == null) total = data.item_count;
      if (pct == null && prog.filled_types != null && prog.total_types) {
        pct = Math.round(
          (Number(prog.filled_types) / Number(prog.total_types)) * 100
        );
      }
      if (pct == null || total == null) {
        card.innerHTML = `<p class="muted">覆盖与条目总数暂不可用</p>`;
        return;
      }
      const combo =
        String(Math.round(Number(pct))) +
        " · " +
        String(Math.round(Number(total)));
      const line = "手册覆盖 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-pct-total-items-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handPctTotalItemsCopyBtn">复制覆盖与条目</button>`;
      const btn = $("#handPctTotalItemsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制覆盖与条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">覆盖与条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制六十批体验层范围 + round 层含 60 */
  async function paintRound60RangeCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#round60RangeCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "round60RangeCopyCard";
      card.className = "card round60-range-copy-card";
      const r50 = $("#round50RangeCopyCard");
      const serverApp = $("#serverAppVersionCopyCard");
      const domainEn = $("#domainBrandEnCopyCard");
      const roundList = $("#roundLayerListCard");
      if (r50 && r50.parentNode)
        r50.insertAdjacentElement("beforebegin", card);
      else if (serverApp && serverApp.parentNode)
        serverApp.insertAdjacentElement("beforebegin", card);
      else if (domainEn && domainEn.parentNode)
        domainEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    const layers = collectRoundLayers();
    const from = layers.length ? Math.min.apply(null, layers) : 6;
    const to = layers.length ? Math.max.apply(null, layers) : 60;
    const lo = Math.min(from, 6);
    const hi = Math.max(to, 60);
    const count = hi - lo + 1;
    const line = "round" + lo + "…round" + hi + " · 共 " + count + " 层";
    card.innerHTML = `<h3>六十批体验层</h3>
      <p class="muted">一键复制六十批里程碑体验层范围（演示级）。</p>
      <p class="round60-range-copy-preview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="round60RangeCopyBtn">复制六十批范围</button>`;
    const btn = $("#round60RangeCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制六十批范围" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList60() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 60;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 60); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round60 均已挂载 · 六十批里程碑。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeRound60Ready(), 430);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdFactoryCopyButtons().catch(() => {}), 340);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisibilityDeptCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinLastNextLabelCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelThrPctCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareIdCoopCopyButtons().catch(() => {}), 340);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthDoneTotalCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdRoleKeyCopyButtons().catch(() => {}), 340);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverPctTotalItemsCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeRound60Ready(), 430);
    if (id === "legacy")
      setTimeout(() => ensureLegacyIdFactoryCopyButtons().catch(() => {}), 360);
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisibilityDeptCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinLastNextLabelCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelThrPctCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareIdCoopCopyButtons().catch(() => {}), 360);
    if (id === "authvideo")
      setTimeout(() => ensureAuthDoneTotalCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdRoleKeyCopyButtons().catch(() => {}), 350);
    if (id === "handover")
      setTimeout(() => ensureHandoverPctTotalItemsCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintRound60RangeCopyCard().catch(() => {});
        paintRoundLayerList60();
      }, 400);
      setTimeout(() => {
        paintRound60RangeCopyCard().catch(() => {});
        paintRoundLayerList60();
      }, 980);
    }
  };

  setTimeout(() => paintHomeRound60Ready(), 490);
  setTimeout(() => ensureLegacyIdFactoryCopyButtons().catch(() => {}), 510);
  setTimeout(() => ensureAssetVisibilityDeptCopyButtons().catch(() => {}), 530);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastNextLabelCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThrPctCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdCoopCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDoneTotalCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRoleKeyCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverPctTotalItemsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintRound60RangeCopyCard().catch(() => {});
      paintRoundLayerList60();
    }, 420);
  }
})();
