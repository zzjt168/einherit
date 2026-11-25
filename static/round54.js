/* 电子继承 · 第五十四批增量（叠在 round53…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round54SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页公司盘点标语一句 */
  async function paintHomeCompanySlogan() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeCompanySloganBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeCompanySloganBar";
      bar.className = "home-company-slogan-bar";
      bar.setAttribute("role", "status");
      const app = $("#homeAppBrandBar");
      const en = $("#homeBrandEnBar");
      const sv = $("#homeServerVersionBar");
      if (app && app.parentNode === home)
        app.insertAdjacentElement("afterend", bar);
      else if (en && en.parentNode === home)
        en.insertAdjacentElement("afterend", bar);
      else if (sv && sv.parentNode === home)
        sv.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/company").catch(() => ({}));
      const slogan = String(
        data.slogan || "个人生命资产盘点 · 五部门温和整理"
      ).trim();
      bar.hidden = false;
      bar.innerHTML = `<span class="home-company-slogan-mark">盘点</span>
        <span class="muted home-company-slogan-sub">${esc(slogan)}</span>
        <button type="button" class="btn ghost sm" id="homeCompanySloganGo">去公司</button>`;
      const btn = $("#homeCompanySloganGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("company");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割类别+处置组合复制 */
  async function ensureLegacyCategoryActionCopyButtons() {
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
      const action = String(it.action || "").trim();
      const line =
        category && action
          ? category + " · " + action
          : category || action;
      el.dataset.categoryAction = line;
      if (!line || el.querySelector(".lg-copy-category-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-action";
      btn.textContent = "复制类别与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryAction || "");
        softBanner(ok ? "已复制类别与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+部门组合复制 */
  async function ensureAssetSummaryDeptCopyButtons() {
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
      const summary = String(it.summary || "").trim();
      const dept = deptLabel(it.dept);
      const line =
        summary && dept ? summary + " · " + dept : summary || dept;
      el.dataset.summaryDept = line;
      if (!line || el.querySelector(".as-copy-summary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-dept";
      btn.textContent = "复制摘要与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryDept || "");
        softBanner(ok ? "已复制摘要与部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近报备绝对时刻 */
  async function ensureCheckinLastLabelCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastLabelCopyCard";
      card.className = "checkin-last-label-copy";
      const ago = $("#checkinLastAgoCopyCard");
      const days = $("#checkinMemberDaysNumCopyCard");
      const interval = $("#checkinIntervalHoursNumCopyCard");
      if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (days && days.parentNode)
        days.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label = String(
        ((st.countdown || {}).last_checkin_label) || ""
      ).trim();
      if (!label) {
        card.innerHTML = `<p class="muted">最近报备时刻暂不可用</p>`;
        return;
      }
      const line =
        "最近报备时刻 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastLabelCopyBtn">复制报备时刻</button>`;
      const btn = $("#checkinLastLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制报备时刻" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备时刻暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与门槛组合复制 */
  async function ensureTravelBalanceThresholdCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdCopyCard";
      card.className = "travel-balance-threshold-copy";
      const kindLabel = $("#travelLedgerKindLabelCopyCard");
      const hasRef = $("#travelHasAftercareRefCopyCard");
      const kind = $("#travelLedgerKindCopyCard");
      if (kindLabel && kindLabel.parentNode)
        kindLabel.insertAdjacentElement("afterend", card);
      else if (hasRef && hasRef.parentNode)
        hasRef.insertAdjacentElement("afterend", card);
      else if (kind && kind.parentNode)
        kind.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal = fund.balance;
      const thr = fund.threshold;
      if (bal == null || thr == null) {
        card.innerHTML = `<p class="muted">余额与门槛暂不可用</p>`;
        return;
      }
      const balN = String(Math.round(Number(bal)));
      const thrN = String(Math.round(Number(thr)));
      const combo = balN + " · " + thrN;
      const line = "差旅余额 · 门槛 · " + combo;
      card.innerHTML = `<p class="muted travel-balance-threshold-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdCopyBtn">复制余额与门槛</button>`;
      const btn = $("#travelBalanceThresholdCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额与门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额与门槛暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+状态组合复制 */
  async function ensureAftercareIdStatusCopyButtons() {
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
      const status = String(it.status_label || "").trim();
      const line = status ? "#" + it.id + " · " + status : "#" + it.id;
      el.dataset.idStatus = line;
      if (el.querySelector(".ac-copy-id-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-status";
      btn.textContent = "复制编号与状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idStatus || "");
        softBanner(ok ? "已复制编号与状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频齐备说明一键复制 */
  async function ensureAuthCompleteLabelCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteLabelCopyCard";
      card.className = "av-complete-label-copy";
      const t2 = $("#avScriptTitle2CopyCard");
      const t1 = $("#avScriptTitle1CopyCard");
      const done = $("#avProgressDoneNumCopyCard");
      if (t2 && t2.parentNode) t2.insertAdjacentElement("afterend", card);
      else if (t1 && t1.parentNode)
        t1.insertAdjacentElement("afterend", card);
      else if (done && done.parentNode)
        done.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const label = String(data.complete_label || "").trim();
      if (!label) {
        card.innerHTML = `<p class="muted">齐备说明暂不可用</p>`;
        return;
      }
      const line = "授权视频齐备说明 · " + label;
      card.innerHTML = `<p class="muted av-complete-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteLabelCopyBtn">复制齐备说明</button>`;
      const btn = $("#avCompleteLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制齐备说明" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">齐备说明暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系纯文本一键复制 */
  async function ensureHeirRelationPlainCopyButtons() {
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
      const relation = String(it.relation || "").trim();
      if (!relation || el.querySelector(".bn-copy-relation-plain")) return;
      el.dataset.relationPlain = relation;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-plain";
      btn.textContent = "复制关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationPlain || "");
        softBanner(ok ? "已复制关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册执行人姓名一键复制 */
  async function ensureHandoverExecutorCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExecutorCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExecutorCopyCard";
      card.className = "hand-executor-copy";
      const pct = $("#handProgressPctNumCopyCard");
      const total = $("#handTotalTypesNumCopyCard");
      const filled = $("#handFilledTypesNumCopyCard");
      if (pct && pct.parentNode)
        pct.insertAdjacentElement("afterend", card);
      else if (total && total.parentNode)
        total.insertAdjacentElement("afterend", card);
      else if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const executor = String(data.executor || "").trim();
      if (!executor) {
        card.innerHTML = `<p class="muted">执行人姓名暂不可用</p>`;
        return;
      }
      const line = "手册执行人 · " + executor;
      card.innerHTML = `<p class="muted hand-executor-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExecutorCopyBtn">复制执行人</button>`;
      const btn = $("#handExecutorCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(executor);
          softBanner(ok ? "已复制执行人" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">执行人暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制英文品牌纯文本 + round 层含 54 */
  async function paintBrandEnPlainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnPlainCopyCard";
      card.className = "card brand-en-plain-copy-card";
      const domain = $("#domainPlainCopyCard");
      const verPlain = $("#versionPlainCopyCard");
      const appVer = $("#appVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (domain && domain.parentNode)
        domain.insertAdjacentElement("beforebegin", card);
      else if (verPlain && verPlain.parentNode)
        verPlain.insertAdjacentElement("beforebegin", card);
      else if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      card.innerHTML = `<h3>英文品牌</h3>
        <p class="muted">一键复制英文品牌纯文本（演示级）。</p>
        <p class="brand-en-plain-copy-preview">${esc(en)}</p>
        <button type="button" class="btn ghost sm" id="brandEnPlainCopyBtn">复制英文品牌</button>`;
      const btn = $("#brandEnPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(en);
          softBanner(ok ? "已复制英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList54() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 54;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 54); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round54 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeCompanySlogan().catch(() => {}), 370);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryActionCopyButtons().catch(() => {}),
      280
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryDeptCopyButtons().catch(() => {}),
      280
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinLastLabelCopy().catch(() => {}), 270);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceThresholdCopy().catch(() => {}), 290);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdStatusCopyButtons().catch(() => {}),
      280
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthCompleteLabelCopy().catch(() => {}), 250);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationPlainCopyButtons().catch(() => {}),
      280
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExecutorCopy().catch(() => {}), 290);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeCompanySlogan().catch(() => {}), 370);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryActionCopyButtons().catch(() => {}),
        300
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryDeptCopyButtons().catch(() => {}),
        290
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinLastLabelCopy().catch(() => {}), 290);
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceThresholdCopy().catch(() => {}),
        310
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdStatusCopyButtons().catch(() => {}),
        300
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthCompleteLabelCopy().catch(() => {}), 270);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationPlainCopyButtons().catch(() => {}),
        290
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverExecutorCopy().catch(() => {}), 300);
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnPlainCopyCard().catch(() => {});
        paintRoundLayerList54();
      }, 340);
      setTimeout(() => {
        paintBrandEnPlainCopyCard().catch(() => {});
        paintRoundLayerList54();
      }, 860);
    }
  };

  // Boot
  setTimeout(() => paintHomeCompanySlogan().catch(() => {}), 430);
  setTimeout(() => ensureLegacyCategoryActionCopyButtons().catch(() => {}), 450);
  setTimeout(() => ensureAssetSummaryDeptCopyButtons().catch(() => {}), 470);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastLabelCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteLabelCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationPlainCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExecutorCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnPlainCopyCard().catch(() => {});
      paintRoundLayerList54();
    }, 360);
  }
})();
