/* 电子继承 · 第八十八批增量（叠在 round87…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round88SoftBanner_" + (hostId || "home");
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

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1";
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

  /* 1 · 首页英文品牌就绪冷静条 */
  async function paintHomeBrandEnOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnOkBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnOkBar";
      bar.className = "home-brand-en-ok-bar";
      bar.setAttribute("role", "status");
      const appName = $("#homeAppNameCalmBar");
      const appOk = $("#homeAppOkCalmBar");
      const server = $("#homeServerVersionCalmBar");
      if (appName && appName.parentNode === home)
        appName.insertAdjacentElement("afterend", bar);
      else if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (server && server.parentNode === home)
        server.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = en + " · " + okPart;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-mark">品牌</span>
        <span class="muted home-brand-en-ok-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkGo">去设置</button>`;
      const btn = $("#homeBrandEnOkGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-mark">品牌</span>
        <span class="muted home-brand-en-ok-sub">英文品牌就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkGo">去设置</button>`;
      const btn = $("#homeBrandEnOkGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+受益人+部门组合复制 */
  async function ensureLegacyCategoryBeneficiaryDeptCopyButtons() {
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
      const cat = String(it.category || "").trim() || "未填分类";
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = cat + " · " + ben + " · " + dept;
      el.dataset.categoryBeneficiaryDept = line;
      if (el.querySelector(".lg-copy-category-beneficiary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-beneficiary-dept";
      btn.textContent = "复制分类受益人部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryBeneficiaryDept || "");
        softBanner(ok ? "已复制分类受益人部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘账号提示+可见性+标签组合复制 */
  async function ensureAssetHintVisTagCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const vis = visibilityLabel(it.visibility);
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = hint + " · " + vis + " · " + tag;
      el.dataset.hintVisTag = line;
      if (el.querySelector(".as-copy-hint-vis-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-vis-tag";
      btn.textContent = "复制提示可见标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintVisTag || "");
        softBanner(ok ? "已复制提示可见标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔小时文案 */
  async function ensureCheckinIntervalHoursPlainR88Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalHoursPlainR88CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalHoursPlainR88CopyCard";
      card.className = "checkin-interval-hours-plain-r88-copy";
      const secs = $("#checkinSecondsRemainingPlainR87CopyCard");
      const last = $("#checkinLastCheckinLabelPlainCopyCard");
      const nextAt = $("#checkinNextSuggestedAtPlainCopyCard");
      if (secs && secs.parentNode) secs.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).interval_hours;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备间隔 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-hours-plain-r88-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalHoursPlainR88CopyBtn">复制间隔小时文案</button>`;
      const btn = $("#checkinIntervalHoursPlainR88CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制间隔小时文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔小时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标与余额组合复制 */
  async function ensureTravelMetBalancePlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetBalancePlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetBalancePlainCopyCard";
      card.className = "travel-met-balance-plain-copy";
      const balShort = $("#travelBalanceShortfallPlainCopyCard");
      const shortPct = $("#travelShortfallProgressPctCopyCard");
      const thrMet = $("#travelThresholdMetPlainCopyCard");
      if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (shortPct && shortPct.parentNode)
        shortPct.insertAdjacentElement("afterend", card);
      else if (thrMet && thrMet.parentNode)
        thrMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = met + " · " + bal;
      const line = "差旅达标 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-balance-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetBalancePlainCopyBtn">复制达标余额文案</button>`;
      const btn = $("#travelMetBalancePlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标余额文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+探访偏好+城市组合复制 */
  async function ensureAftercareIdVisitPrefCityCopyButtons() {
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
      const pref = String(it.visit_pref || "").trim() || "未填偏好";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + it.id + " · " + pref + " · " + city;
      el.dataset.idVisitPrefCity = line;
      if (el.querySelector(".ac-copy-id-visit-pref-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-visit-pref-city";
      btn.textContent = "复制编号探访城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idVisitPrefCity || "");
        softBanner(ok ? "已复制编号探访城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单条数与就绪组合复制 */
  async function ensureAuthChecklistReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistReadyCopyCard";
      card.className = "av-checklist-ready-copy";
      const active = $("#avActiveIdReadyCopyCard");
      const complete = $("#avCompleteLabelReadyComboCopyCard");
      const gateMiss = $("#avGateMissingTextCopyCard");
      if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (gateMiss && gateMiss.parentNode)
        gateMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const count = list.length;
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = "清单 " + count + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistReadyCopyBtn">复制清单与就绪</button>`;
      const btn = $("#avChecklistReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系+角色组合复制 */
  async function ensureHeirIdContactRoleCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const role = String(it.role || "").trim() || "未填角色";
      const line = "#" + it.id + " · " + contact + " · " + role;
      if (el.querySelector(".bn-copy-id-contact-role")) return;
      el.dataset.idContactRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-role";
      btn.textContent = "复制编号联系角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactRole || "");
        softBanner(ok ? "已复制编号联系角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数与分享提示组合复制 */
  async function ensureHandoverItemCountShareHintCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountShareHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountShareHintCopyCard";
      card.className = "hand-item-count-share-hint-copy";
      const exportShare = $("#handExportPathShareHintCopyCard");
      const genDom = $("#handGeneratedAtDomainCopyCard");
      const itemBrand = $("#handItemCountBrandR85CopyCard");
      if (exportShare && exportShare.parentNode)
        exportShare.insertAdjacentElement("afterend", card);
      else if (genDom && genDom.parentNode)
        genDom.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const combo = count + " · " + hint;
      const line = "手册条目 · 分享 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-share-hint-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountShareHintCopyBtn">复制条目分享提示</button>`;
      const btn = $("#handItemCountShareHintCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目分享提示" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目数与分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+就绪+英文品牌组合复制 + round 层含 88 */
  async function paintDomainOkBrandEnR88CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainOkBrandEnR88CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainOkBrandEnR88CopyCard";
      card.className = "card domain-ok-brand-en-r88-copy-card";
      const appVer = $("#appVersionBrandEnR87CopyCard");
      const server = $("#serverOkBrandEnR86CopyCard");
      const okDom = $("#okDomainVersionR85CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (server && server.parentNode)
        server.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · ok·" + okPart + " · " + en;
      card.innerHTML = `<h3>域名 · 就绪 · 英文品牌</h3>
        <p class="muted">一键复制域名、就绪状态与英文品牌（演示级）。</p>
        <p class="domain-ok-brand-en-r88-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainOkBrandEnR88CopyBtn">复制域名就绪英文</button>`;
      const btn = $("#domainOkBrandEnR88CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList88() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 88;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 88); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round88 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnOk().catch(() => {}), 710);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryBeneficiaryDeptCopyButtons().catch(() => {}),
      540
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetHintVisTagCopyButtons().catch(() => {}),
      540
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinIntervalHoursPlainR88Copy().catch(() => {}),
      530
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelMetBalancePlainCopy().catch(() => {}), 550);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdVisitPrefCityCopyButtons().catch(() => {}),
      540
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthChecklistReadyCopy().catch(() => {}), 510);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdContactRoleCopyButtons().catch(() => {}),
      540
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountShareHintCopy().catch(() => {}),
      550
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnOk().catch(() => {}), 710);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryBeneficiaryDeptCopyButtons().catch(() => {}),
        560
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetHintVisTagCopyButtons().catch(() => {}),
        550
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinIntervalHoursPlainR88Copy().catch(() => {}),
        550
      );
    if (id === "travel")
      setTimeout(() => ensureTravelMetBalancePlainCopy().catch(() => {}), 570);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdVisitPrefCityCopyButtons().catch(() => {}),
        560
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthChecklistReadyCopy().catch(() => {}), 530);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdContactRoleCopyButtons().catch(() => {}),
        550
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountShareHintCopy().catch(() => {}),
        560
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkBrandEnR88CopyCard().catch(() => {});
        paintRoundLayerList88();
      }, 600);
      setTimeout(() => {
        paintDomainOkBrandEnR88CopyCard().catch(() => {});
        paintRoundLayerList88();
      }, 1280);
    }
  };

  setTimeout(() => paintHomeBrandEnOk().catch(() => {}), 760);
  setTimeout(
    () => ensureLegacyCategoryBeneficiaryDeptCopyButtons().catch(() => {}),
    780
  );
  setTimeout(() => ensureAssetHintVisTagCopyButtons().catch(() => {}), 800);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalHoursPlainR88Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetBalancePlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdVisitPrefCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountShareHintCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkBrandEnR88CopyCard().catch(() => {});
      paintRoundLayerList88();
    }, 620);
  }
})();
