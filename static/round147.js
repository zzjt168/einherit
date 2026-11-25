/* 电子继承 · 第一百四十七批增量（叠在 round146…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round147SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+英文品牌+中文品牌冷静条 */
  async function paintHomeOkBrandEnBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnBrandCalmBarR147");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnBrandCalmBarR147";
      bar.className = "home-ok-brand-en-brand-calm-r147";
      bar.setAttribute("role", "status");
      const enVer = $("#homeBrandEnVersionDomainCalmBarR146");
      const domainOk = $("#homeDomainOkBrandCalmBarR145");
      const okBrand = $("#homeOkBrandVersionCalmBarR144");
      if (enVer && enVer.parentNode === home)
        enVer.insertAdjacentElement("afterend", bar);
      else if (domainOk && domainOk.parentNode === home)
        domainOk.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = ready + " · " + en + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-brand-calm-r147-mark">就绪</span>
        <span class="muted home-ok-brand-en-brand-calm-r147-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnBrandCalmGoR147">去设置</button>`;
      const btn = $("#homeOkBrandEnBrandCalmGoR147");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-brand-calm-r147-mark">就绪</span>
        <span class="muted home-ok-brand-en-brand-calm-r147-sub">就绪英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnBrandCalmGoR147">去设置</button>`;
      const btn = $("#homeOkBrandEnBrandCalmGoR147");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+设备归属+受益人组合复制 */
  async function ensureLegacyTitleDeviceOwnerBeneficiaryCopyButtons() {
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
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const owner =
        String(it.device_owner || it.dept || "").trim() || "未填归属";
      const beneficiary =
        String(it.beneficiary || "").trim() || "未填受益人";
      const line = title + " · " + owner + " · " + beneficiary;
      el.dataset.titleDeviceOwnerBeneficiary = line;
      if (el.querySelector(".lg-copy-title-device-owner-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-device-owner-beneficiary";
      btn.textContent = "复制标题归属受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDeviceOwnerBeneficiary || "");
        softBanner(ok ? "已复制标题归属受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+分类+标题组合复制 */
  async function ensureAssetSummaryCategoryTitleCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const category =
        String(it.category || it.tag || it.dept || "").trim() || "未填分类";
      const title =
        String(it.title || it.platform || "").trim() || "无标题";
      const line = summary + " · " + category + " · " + title;
      el.dataset.summaryCategoryTitle = line;
      if (el.querySelector(".as-copy-summary-category-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-category-title";
      btn.textContent = "复制摘要分类标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryCategoryTitle || "");
        softBanner(ok ? "已复制摘要分类标题" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+距上次标签 */
  async function ensureCheckinNextAtLastAgoPlainR147Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtLastAgoPlainR147CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtLastAgoPlainR147CopyCard";
      card.className = "checkin-next-at-last-ago-plain-r147-copy";
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR146CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR145CopyCard");
      const statusNext = $("#checkinStatusLabelNextAtPlainR144CopyCard");
      if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
      else if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const user = st.user || {};
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = nextAt + " · " + lastAgo;
      const line =
        "报备下次建议 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-last-ago-plain-r147-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtLastAgoPlainR147CopyBtn">复制下次距上次R147</button>`;
      const btn = $("#checkinNextAtLastAgoPlainR147CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距上次R147" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+短差+余额三元复制 */
  async function ensureTravelThresholdShortfallBalancePlainR147Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdShortfallBalancePlainR147CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdShortfallBalancePlainR147CopyCard";
      card.className = "travel-threshold-shortfall-balance-plain-r147-copy";
      const progMet = $("#travelProgressMetDepositedPlainR146CopyCard");
      const depBal = $("#travelDepositedBalanceShortfallPlainR145CopyCard");
      const balMet = $("#travelBalanceMetThresholdPlainR144CopyCard");
      if (progMet && progMet.parentNode)
        progMet.insertAdjacentElement("afterend", card);
      else if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = thr + " · " + shortfall + " · " + bal;
      const line =
        "差旅门槛 · 短差 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-shortfall-balance-plain-r147-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdShortfallBalancePlainR147CopyBtn">复制门槛短差余额</button>`;
      const btn = $("#travelThresholdShortfallBalancePlainR147CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛短差余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛短差余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+状态+医院组合复制 */
  async function ensureAftercareServiceStatusHospitalCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const line = service + " · " + status + " · " + hospital;
      el.dataset.serviceStatusHospital = line;
      if (el.querySelector(".ac-copy-service-status-hospital")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-status-hospital";
      btn.textContent = "复制服务状态医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceStatusHospital || "");
        softBanner(ok ? "已复制服务状态医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+时长提示+就绪组合复制 */
  async function ensureAuthCompleteDurationReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteDurationReadyCopyR147Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteDurationReadyCopyR147Card";
      card.className = "av-complete-duration-ready-copy-r147";
      const durReady = $("#avDurationReadyMissingCopyR146Card");
      const missComplete = $("#avMissingCompleteReadyCopyR145Card");
      const readyTitle = $("#avReadyTitleMissingCopyR144Card");
      if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else if (readyTitle && readyTitle.parentNode)
        readyTitle.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "未填时长";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = complete + " · " + duration + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-duration-ready-copy-r147-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteDurationReadyCopyR147Btn">复制完成时长就绪</button>`;
      const btn = $("#avCompleteDurationReadyCopyR147Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成时长就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成时长就绪暂不可用</p>`;
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
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const id = String(it.id);
      const line = relation + " · " + passphrase + " · #" + id;
      if (el.querySelector(".bn-copy-relation-passphrase-id-r147")) return;
      el.dataset.relationPassphraseIdR147 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-passphrase-id-r147";
      btn.textContent = "复制关系口令编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationPassphraseIdR147 || "");
        softBanner(ok ? "已复制关系口令编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+进度百分比+完成数组合复制 */
  async function ensureHandoverSectionsPctDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsPctDoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsPctDoneCopyCard";
      card.className = "hand-sections-pct-done-copy";
      const brandDom = $("#handBrandDomainSectionsCopyCard");
      const pctDone = $("#handPctDoneDomainCopyCard");
      const doneBrand = $("#handDoneBrandSectionsCopyCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (data.progress_pct != null) pct = String(data.progress_pct) + "%";
      else if (typeof data.progress === "number")
        pct = String(data.progress) + "%";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = sectionsCount + " · " + pct + " · " + done;
      const line = "手册章节 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-pct-done-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsPctDoneCopyBtn">复制章节进度完成</button>`;
      const btn = $("#handSectionsPctDoneCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节进度完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节进度完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+就绪+版本+域名四元复制 + round 层含 147 */
  async function paintBrandEnOkVersionDomainR147CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnOkVersionDomainR147CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnOkVersionDomainR147CopyCard";
      card.className = "card settings-brand-en-ok-version-domain-r147-copy-card";
      const verDom = $("#settingsVersionDomainOkBrandR146CopyCard");
      const domainOk = $("#settingsDomainOkBrandEnBrandR145CopyCard");
      const okBrand = $("#settingsOkBrandEnBrandVersionR144CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = en + " · " + ready + " · " + ver + " · " + domain;
      card.innerHTML = `<h3>英文 · 就绪 · 版本 · 域名</h3>
        <p class="muted">一键复制英文品牌、就绪状态、版本与域名（演示级）。</p>
        <p class="settings-brand-en-ok-version-domain-r147-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnOkVersionDomainR147CopyBtn">复制英文就绪版本域名</button>`;
      const btn = $("#settingsBrandEnOkVersionDomainR147CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文就绪版本域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 就绪 · 版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList147() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 147;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 147); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round147 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnBrand().catch(() => {}), 940);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleDeviceOwnerBeneficiaryCopyButtons().catch(() => {}),
      770
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryCategoryTitleCopyButtons().catch(() => {}),
      770
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtLastAgoPlainR147Copy().catch(() => {}),
      760
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdShortfallBalancePlainR147Copy().catch(() => {}),
      780
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceStatusHospitalCopyButtons().catch(() => {}),
      770
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteDurationReadyCopy().catch(() => {}),
      740
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationPassphraseIdCopyButtons().catch(() => {}),
      770
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsPctDoneCopy().catch(() => {}),
      780
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnBrand().catch(() => {}), 940);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDeviceOwnerBeneficiaryCopyButtons().catch(
            () => {}
          ),
        790
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryCategoryTitleCopyButtons().catch(() => {}),
        780
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtLastAgoPlainR147Copy().catch(() => {}),
        780
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdShortfallBalancePlainR147Copy().catch(
            () => {}
          ),
        800
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceStatusHospitalCopyButtons().catch(() => {}),
        790
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteDurationReadyCopy().catch(() => {}),
        760
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationPassphraseIdCopyButtons().catch(() => {}),
        780
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsPctDoneCopy().catch(() => {}),
        790
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnOkVersionDomainR147CopyCard().catch(() => {});
        paintRoundLayerList147();
      }, 830);
      setTimeout(() => {
        paintBrandEnOkVersionDomainR147CopyCard().catch(() => {});
        paintRoundLayerList147();
      }, 1510);
    }
  };

  setTimeout(() => paintHomeOkBrandEnBrand().catch(() => {}), 990);
  setTimeout(
    () =>
      ensureLegacyTitleDeviceOwnerBeneficiaryCopyButtons().catch(() => {}),
    1010
  );
  setTimeout(
    () => ensureAssetSummaryCategoryTitleCopyButtons().catch(() => {}),
    1030
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtLastAgoPlainR147Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdShortfallBalancePlainR147Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceStatusHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteDurationReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationPassphraseIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsPctDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnOkVersionDomainR147CopyCard().catch(() => {});
      paintRoundLayerList147();
    }, 850);
  }
})();
