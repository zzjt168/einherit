/* 电子继承 · 第五十五批增量（叠在 round54…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round55SoftBanner_" + (hostId || "home");
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

  function serviceLabel(raw) {
    const map =
      typeof SERVICE_LABEL === "object" && SERVICE_LABEL
        ? SERVICE_LABEL
        : {
            delete_data: "删除电子数据",
            sell_asset: "变卖电子资产",
            field_visit: "上门执行",
            legal_consult: "法律顾问协办",
            data_wipe: "删除电子数据",
          };
    const k = String(raw || "");
    return map[k] || k;
  }

  /* 1 · 首页受益人条数一句 */
  async function paintHomeBeneCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBeneCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBeneCountBar";
      bar.className = "home-bene-count-bar";
      bar.setAttribute("role", "status");
      const slogan = $("#homeCompanySloganBar");
      const app = $("#homeAppBrandBar");
      const assets = $("#homeAssetsCountBar");
      if (slogan && slogan.parentNode === home)
        slogan.insertAdjacentElement("afterend", bar);
      else if (app && app.parentNode === home)
        app.insertAdjacentElement("afterend", bar);
      else if (assets && assets.parentNode === home)
        assets.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/counts-summary").catch(() => ({}));
      const n = (data.counts || {}).beneficiaries;
      const num = n == null ? "—" : String(Math.round(Number(n)));
      bar.hidden = false;
      bar.innerHTML = `<span class="home-bene-count-mark">受益人</span>
        <span class="muted home-bene-count-sub">已指定 ${esc(
          num
        )} 位受益人</span>
        <button type="button" class="btn ghost sm" id="homeBeneCountGo">去受益人</button>`;
      const btn = $("#homeBeneCountGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("heirs");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割类别纯文本一键复制 */
  async function ensureLegacyCategoryPlainCopyButtons() {
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
      if (!it) return;
      const category = String(it.category || "").trim();
      if (!category || el.querySelector(".lg-copy-category-plain")) return;
      el.dataset.categoryPlain = category;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-plain";
      btn.textContent = "复制类别";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryPlain || "");
        softBanner(ok ? "已复制类别" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+部门组合复制 */
  async function ensureAssetIdDeptCopyButtons() {
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
      if (!it || it.id == null) return;
      const dept = deptLabel(it.dept);
      const line = dept ? "#" + it.id + " · " + dept : "#" + it.id;
      el.dataset.idDept = line;
      if (el.querySelector(".as-copy-id-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-dept";
      btn.textContent = "复制编号与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDept || "");
        softBanner(ok ? "已复制编号与部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次小时纯数字 */
  async function ensureCheckinHoursSinceNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursSinceNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursSinceNumCopyCard";
      card.className = "checkin-hours-since-num-copy";
      const last = $("#checkinLastLabelCopyCard");
      const ago = $("#checkinLastAgoCopyCard");
      const days = $("#checkinMemberDaysNumCopyCard");
      if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode)
        days.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const hours = (st.countdown || {}).hours_since_last;
      if (hours == null) {
        card.innerHTML = `<p class="muted">距上次报备小时暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(hours)));
      const line =
        "距上次报备小时 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-since-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursSinceNumCopyBtn">复制距上次小时</button>`;
      const btn = $("#checkinHoursSinceNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制距上次小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近断缴退款种类键一键复制 */
  async function ensureTravelRefundKindCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelRefundKindCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelRefundKindCopyCard";
      card.className = "travel-refund-kind-copy";
      const bal = $("#travelBalanceThresholdCopyCard");
      const kindLabel = $("#travelLedgerKindLabelCopyCard");
      const hasRef = $("#travelHasAftercareRefCopyCard");
      if (bal && bal.parentNode)
        bal.insertAdjacentElement("afterend", card);
      else if (kindLabel && kindLabel.parentNode)
        kindLabel.insertAdjacentElement("afterend", card);
      else if (hasRef && hasRef.parentNode)
        hasRef.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const refund = fund.last_refund || null;
      const kind = refund && String(refund.kind || "").trim();
      if (!kind) {
        card.innerHTML = `<p class="muted">暂无断缴退款种类可复制</p>`;
        return;
      }
      const line = "最近断缴退款种类 · " + kind;
      card.innerHTML = `<p class="muted travel-refund-kind-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelRefundKindCopyBtn">复制退款种类键</button>`;
      const btn = $("#travelRefundKindCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(kind);
          softBanner(ok ? "已复制退款种类键" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款种类暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+城市组合复制 */
  async function ensureAftercareServiceCityCopyButtons() {
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
      if (!it) return;
      const svc = serviceLabel(it.service_type);
      const city = String(it.city || "").trim();
      const line = svc && city ? svc + " · " + city : svc || city;
      el.dataset.serviceCity = line;
      if (!line || el.querySelector(".ac-copy-service-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-city";
      btn.textContent = "复制服务与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceCity || "");
        softBanner(ok ? "已复制服务与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门槛总数纯数字一键复制 */
  async function ensureAuthProgressTotalNumCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressTotalNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressTotalNumCopyCard";
      card.className = "av-progress-total-num-copy";
      const complete = $("#avCompleteLabelCopyCard");
      const t2 = $("#avScriptTitle2CopyCard");
      const done = $("#avProgressDoneNumCopyCard");
      if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (t2 && t2.parentNode)
        t2.insertAdjacentElement("afterend", card);
      else if (done && done.parentNode)
        done.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const total = (data.progress || {}).total;
      if (total == null) {
        card.innerHTML = `<p class="muted">门槛总数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(total)));
      const line = "授权视频门槛总数 · " + num;
      card.innerHTML = `<p class="muted av-progress-total-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avProgressTotalNumCopyBtn">复制门槛总数</button>`;
      const btn = $("#avProgressTotalNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制门槛总数" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛总数暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号纯数字一键复制 */
  async function ensureHeirIdPlainCopyButtons() {
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
      if (el.querySelector(".bn-copy-id-plain")) return;
      const num = String(it.id);
      el.dataset.idPlain = num;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-plain";
      btn.textContent = "复制编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlain || "");
        softBanner(ok ? "已复制编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册转赠条数纯数字一键复制 */
  async function ensureHandoverGiftCountNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGiftCountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGiftCountNumCopyCard";
      card.className = "hand-gift-count-num-copy";
      const share = $("#handShareHintCopyCard");
      const executor = $("#handExecutorCopyCard");
      const pct = $("#handProgressPctNumCopyCard");
      if (share && share.parentNode)
        share.insertAdjacentElement("afterend", card);
      else if (executor && executor.parentNode)
        executor.insertAdjacentElement("afterend", card);
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
      let gift = (prog.action_counts || {}).gift;
      if (gift == null && Array.isArray(prog.by_action)) {
        const row = prog.by_action.find(
          (x) => String(x.action || "") === "转赠"
        );
        if (row) gift = row.count;
      }
      if (gift == null) {
        card.innerHTML = `<p class="muted">转赠条数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(gift)));
      const line = "手册转赠条数 · " + num;
      card.innerHTML = `<p class="muted hand-gift-count-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGiftCountNumCopyBtn">复制转赠条数</button>`;
      const btn = $("#handGiftCountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制转赠条数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">转赠条数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制服务端版本纯文本 + round 层含 55 */
  async function paintServerVersionPlainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverVersionPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverVersionPlainCopyCard";
      card.className = "card server-version-plain-copy-card";
      const brandEn = $("#brandEnPlainCopyCard");
      const domain = $("#domainPlainCopyCard");
      const verPlain = $("#versionPlainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (domain && domain.parentNode)
        domain.insertAdjacentElement("beforebegin", card);
      else if (verPlain && verPlain.parentNode)
        verPlain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const sv = String(h.server_version || "EInherit/0.5").trim();
      card.innerHTML = `<h3>服务端版本</h3>
        <p class="muted">一键复制服务端版本纯文本（演示级）。</p>
        <p class="server-version-plain-copy-preview">${esc(sv)}</p>
        <button type="button" class="btn ghost sm" id="serverVersionPlainCopyBtn">复制服务端版本</button>`;
      const btn = $("#serverVersionPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(sv);
          softBanner(ok ? "已复制服务端版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList55() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 55;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 55); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round55 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBeneCount().catch(() => {}), 380);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryPlainCopyButtons().catch(() => {}),
      290
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdDeptCopyButtons().catch(() => {}), 290);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinHoursSinceNumCopy().catch(() => {}), 280);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelRefundKindCopy().catch(() => {}), 300);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceCityCopyButtons().catch(() => {}),
      290
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthProgressTotalNumCopy().catch(() => {}), 260);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdPlainCopyButtons().catch(() => {}), 290);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverGiftCountNumCopy().catch(() => {}), 300);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBeneCount().catch(() => {}), 380);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryPlainCopyButtons().catch(() => {}),
        310
      );
    if (id === "assets")
      setTimeout(() => ensureAssetIdDeptCopyButtons().catch(() => {}), 300);
    if (id === "checkin")
      setTimeout(() => ensureCheckinHoursSinceNumCopy().catch(() => {}), 300);
    if (id === "travel")
      setTimeout(() => ensureTravelRefundKindCopy().catch(() => {}), 320);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceCityCopyButtons().catch(() => {}),
        310
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthProgressTotalNumCopy().catch(() => {}), 280);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdPlainCopyButtons().catch(() => {}), 300);
    if (id === "handover")
      setTimeout(() => ensureHandoverGiftCountNumCopy().catch(() => {}), 310);
    if (id === "settings") {
      setTimeout(() => {
        paintServerVersionPlainCopyCard().catch(() => {});
        paintRoundLayerList55();
      }, 350);
      setTimeout(() => {
        paintServerVersionPlainCopyCard().catch(() => {});
        paintRoundLayerList55();
      }, 880);
    }
  };

  setTimeout(() => paintHomeBeneCount().catch(() => {}), 440);
  setTimeout(() => ensureLegacyCategoryPlainCopyButtons().catch(() => {}), 460);
  setTimeout(() => ensureAssetIdDeptCopyButtons().catch(() => {}), 480);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursSinceNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelRefundKindCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressTotalNumCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdPlainCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGiftCountNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerVersionPlainCopyCard().catch(() => {});
      paintRoundLayerList55();
    }, 370);
  }
})();
