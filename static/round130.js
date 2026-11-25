/* 电子继承 · 第一百三十批增量（叠在 round129…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round130SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+英文品牌+就绪冷静条 */
  async function paintHomeBrandBrandEnOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandBrandEnOkCalmBarR130");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandBrandEnOkCalmBarR130";
      bar.className = "home-brand-brand-en-ok-calm-r130";
      bar.setAttribute("role", "status");
      const domEn = $("#homeDomainBrandEnVersionCalmBarR129");
      const okApp = $("#homeOkAppDomainCalmBarR128");
      const brandEn = $("#homeBrandEnDomainOkCalmBarR127");
      if (domEn && domEn.parentNode === home)
        domEn.insertAdjacentElement("afterend", bar);
      else if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = brand + " · " + en + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-ok-calm-r130-mark">品牌</span>
        <span class="muted home-brand-brand-en-ok-calm-r130-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnOkCalmGoR130">去设置</button>`;
      const btn = $("#homeBrandBrandEnOkCalmGoR130");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-ok-calm-r130-mark">品牌</span>
        <span class="muted home-brand-brand-en-ok-calm-r130-sub">中英文就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnOkCalmGoR130">去设置</button>`;
      const btn = $("#homeBrandBrandEnOkCalmGoR130");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+受益人+编号组合复制 */
  async function ensureLegacyTitleBeneficiaryIdCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const id = String(it.id);
      const line = title + " · " + bene + " · #" + id;
      el.dataset.titleBeneficiaryId = line;
      if (el.querySelector(".lg-copy-title-beneficiary-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-beneficiary-id";
      btn.textContent = "复制标题受益人编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBeneficiaryId || "");
        softBanner(ok ? "已复制标题受益人编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置说明+平台+可见性组合复制 */
  async function ensureAssetDisposePlatformVisibilityCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const platform = String(it.platform || "").trim() || "未填平台";
      const vis = String(it.visibility || "").trim() || "未填可见性";
      const line = dispose + " · " + platform + " · " + vis;
      el.dataset.disposePlatformVisibility = line;
      if (el.querySelector(".as-copy-dispose-platform-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-platform-visibility";
      btn.textContent = "复制处置平台可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposePlatformVisibility || "");
        softBanner(ok ? "已复制处置平台可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制建议下次+距上次标签 */
  async function ensureCheckinNextAtLastAgoPlainR130Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtLastAgoPlainR130CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtLastAgoPlainR130CopyCard";
      card.className = "checkin-next-at-last-ago-plain-r130-copy";
      const graceHrs = $("#checkinGraceHoursRemainingPlainR129CopyCard");
      const hrsInt = $("#checkinHoursRemainingIntervalPlainR128CopyCard");
      const lastOk = $("#checkinLastOkNextDuePlainR127CopyCard");
      if (graceHrs && graceHrs.parentNode)
        graceHrs.insertAdjacentElement("afterend", card);
      else if (hrsInt && hrsInt.parentNode)
        hrsInt.insertAdjacentElement("afterend", card);
      else if (lastOk && lastOk.parentNode)
        lastOk.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const lastAgo = String(cd.last_ago_label || "").trim() || "—";
      const combo = nextAt + " · " + lastAgo;
      const line =
        "下次建议时刻 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-last-ago-plain-r130-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtLastAgoPlainR130CopyBtn">复制下次距上次R130</button>`;
      const btn = $("#checkinNextAtLastAgoPlainR130CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距上次R130" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+进度百分比+余额三元复制 */
  async function ensureTravelMetProgressBalancePlainR130Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetProgressBalancePlainR130CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetProgressBalancePlainR130CopyCard";
      card.className = "travel-met-progress-balance-plain-r130-copy";
      const balMet = $("#travelBalanceMetProgressPlainR129CopyCard");
      const shortProg = $("#travelShortfallProgressThresholdPlainR128CopyCard");
      const curBal = $("#travelCurrencyBalanceMetPlainR127CopyCard");
      if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (shortProg && shortProg.parentNode)
        shortProg.insertAdjacentElement("afterend", card);
      else if (curBal && curBal.parentNode)
        curBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = met + " · " + pct + "% · " + bal;
      const line =
        "差旅达标 · 进度 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-progress-balance-plain-r130-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetProgressBalancePlainR130CopyBtn">复制达标进度余额</button>`;
      const btn = $("#travelMetProgressBalancePlainR130CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标进度余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标进度余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+城市+编号组合复制 */
  async function ensureAftercareServiceCityIdCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const city = String(it.city || "").trim() || "未填城市";
      const id = String(it.id);
      const line = service + " · " + city + " · #" + id;
      el.dataset.serviceCityId = line;
      if (el.querySelector(".ac-copy-service-city-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-city-id";
      btn.textContent = "复制服务城市编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceCityId || "");
        softBanner(ok ? "已复制服务城市编号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+就绪+缺失项组合复制 */
  async function ensureAuthCompleteReadyMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyMissingCopyR130Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyMissingCopyR130Card";
      card.className = "av-complete-ready-missing-copy-r130";
      const completeGate = $("#avCompleteMissingGateCountR129CopyCard");
      const gateReady = $("#avGateReadyChecklistCountR128CopyCard");
      const readyMiss = $("#avReadyCompleteMissingCountR127CopyCard");
      if (completeGate && completeGate.parentNode)
        completeGate.insertAdjacentElement("afterend", card);
      else if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const complete =
        truthyFlag(data.complete) ||
        (missing.length === 0 && truthyFlag(data.ready))
          ? "完整"
          : "未完整";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : missing
              .slice(0, 3)
              .map((m) => String(m))
              .join("、") + (missing.length > 3 ? "…" : "");
      const combo = complete + " · " + ready + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-missing-copy-r130-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyMissingCopyR130Btn">复制完成就绪缺失</button>`;
      const btn = $("#avCompleteReadyMissingCopyR130Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+口令提示+编号组合复制 */
  async function ensureHeirRelationPassphraseIdCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const id = String(it.id);
      const line = relation + " · " + hint + " · #" + id;
      if (el.querySelector(".bn-copy-relation-passphrase-id")) return;
      el.dataset.relationPassphraseId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-passphrase-id";
      btn.textContent = "复制关系口令编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationPassphraseId || "");
        softBanner(ok ? "已复制关系口令编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+进度百分比+域名组合复制 */
  async function ensureHandoverBrandProgressDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandProgressDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandProgressDomainCopyCard";
      card.className = "hand-brand-progress-domain-copy";
      const domItem = $("#handDomainItemCountVersionCopyCard");
      const todosDom = $("#handTodosDomainBrandCopyCard");
      const brandVer = $("#handBrandVersionItemCountCopyCard");
      if (domItem && domItem.parentNode)
        domItem.insertAdjacentElement("afterend", card);
      else if (todosDom && todosDom.parentNode)
        todosDom.insertAdjacentElement("afterend", card);
      else if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "无品牌";
      const prog = data.progress || {};
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = brand + " · " + pct + "% · " + domain;
      const line = "手册品牌 · 进度 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-progress-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandProgressDomainCopyBtn">复制品牌进度域名</button>`;
      const btn = $("#handBrandProgressDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌进度域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌进度域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+中文品牌+版本+域名四元复制 + round 层含 130 */
  async function paintOkBrandVersionDomainR130CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandVersionDomainR130CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandVersionDomainR130CopyCard";
      card.className = "card settings-ok-brand-version-domain-r130-copy-card";
      const verApp = $("#settingsVersionAppBrandEnOkR129CopyCard");
      const okBrand = $("#settingsOkBrandEnDomainAppR128CopyCard");
      const appDom = $("#settingsAppDomainVersionOkR127CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ready + " · " + brand + " · " + ver + " · " + domain;
      card.innerHTML = `<h3>就绪 · 品牌 · 版本 · 域名</h3>
        <p class="muted">一键复制就绪状态、中文品牌、版本与域名（演示级）。</p>
        <p class="settings-ok-brand-version-domain-r130-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandVersionDomainR130CopyBtn">复制就绪品牌版本域名</button>`;
      const btn = $("#settingsOkBrandVersionDomainR130CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪品牌版本域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 品牌 · 版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList130() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 130;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 130); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round130 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandBrandEnOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleBeneficiaryIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposePlatformVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtLastAgoPlainR130Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetProgressBalancePlainR130Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceCityIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationPassphraseIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandProgressDomainCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandBrandEnOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleBeneficiaryIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetDisposePlatformVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtLastAgoPlainR130Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetProgressBalancePlainR130Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceCityIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationPassphraseIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandProgressDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandVersionDomainR130CopyCard().catch(() => {});
        paintRoundLayerList130();
      }, 710);
      setTimeout(() => {
        paintOkBrandVersionDomainR130CopyCard().catch(() => {});
        paintRoundLayerList130();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandBrandEnOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleBeneficiaryIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetDisposePlatformVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtLastAgoPlainR130Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetProgressBalancePlainR130Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceCityIdCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationPassphraseIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandProgressDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandVersionDomainR130CopyCard().catch(() => {});
      paintRoundLayerList130();
    }, 730);
  }
})();
