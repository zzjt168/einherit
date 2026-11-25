/* 电子继承 · 第一百六十一批增量（叠在 round160…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round161SoftBanner_" + (hostId || "home");
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
    let bar = $("#homeBrandBrandEnOkCalmBarR161");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandBrandEnOkCalmBarR161";
      bar.className = "home-brand-brand-en-ok-calm-r161";
      bar.setAttribute("role", "status");
      const verOk = $("#homeVersionOkDomainCalmBarR160");
      const domainEn = $("#homeDomainBrandEnBrandCalmBarR159");
      const brandOk = $("#homeBrandOkVersionCalmBarR158");
      if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
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
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = brand + " · " + en + " · " + okLabel;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-ok-calm-r161-mark">品牌</span>
        <span class="muted home-brand-brand-en-ok-calm-r161-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnOkCalmGoR161">去设置</button>`;
      const btn = $("#homeBrandBrandEnOkCalmGoR161");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-ok-calm-r161-mark">品牌</span>
        <span class="muted home-brand-brand-en-ok-calm-r161-sub">中英文品牌就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnOkCalmGoR161">去设置</button>`;
      const btn = $("#homeBrandBrandEnOkCalmGoR161");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+标题+编号组合复制 */
  async function ensureLegacyDeviceOwnerTitleIdCopyButtons() {
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
      const owner =
        String(it.device_owner || it.dept || "").trim() || "未填归属";
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const id = it.id != null ? String(it.id) : "—";
      const line = owner + " · " + title + " · " + id;
      el.dataset.deviceOwnerTitleId = line;
      if (el.querySelector(".lg-copy-device-owner-title-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-title-id";
      btn.textContent = "复制归属标题编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerTitleId || "");
        softBanner(ok ? "已复制归属标题编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+分类组合复制 */
  async function ensureAssetTagVisibilityCategoryCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const line = tag + " · " + visibility + " · " + category;
      el.dataset.tagVisibilityCategory = line;
      if (el.querySelector(".as-copy-tag-visibility-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-category";
      btn.textContent = "复制标签可见分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVisibilityCategory || "");
        softBanner(ok ? "已复制标签可见分类" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+状态标签 */
  async function ensureCheckinNextAtStatusLabelPlainR161Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtStatusLabelPlainR161CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtStatusLabelPlainR161CopyCard";
      card.className = "checkin-next-at-status-label-plain-r161-copy";
      const statusLast = $("#checkinStatusLabelLastAgoPlainR160CopyCard");
      const winNext = $("#checkinWindowEndsNextAtPlainR159CopyCard");
      const nextLast = $("#checkinNextAtLastAgoPlainR158CopyCard");
      if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            cd.status ||
            ""
        ).trim() || "暂无状态";
      const combo = nextAt + " · " + statusLabel;
      const line =
        "报备下次建议 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-status-label-plain-r161-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtStatusLabelPlainR161CopyBtn">复制下次状态R161</button>`;
      const btn = $("#checkinNextAtStatusLabelPlainR161CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次状态R161" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+短差+已存三元复制 */
  async function ensureTravelThresholdShortfallDepositedPlainR161Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdShortfallDepositedPlainR161CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdShortfallDepositedPlainR161CopyCard";
      card.className = "travel-threshold-shortfall-deposited-plain-r161-copy";
      const depBal = $("#travelDepositedBalanceShortfallPlainR160CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR159CopyCard");
      const balProg = $("#travelBalanceProgressThresholdPlainR158CopyCard");
      if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (balProg && balProg.parentNode)
        balProg.insertAdjacentElement("afterend", card);
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
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const combo = thr + " · " + shortfall + " · " + deposited;
      const line =
        "差旅门槛 · 短差 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-shortfall-deposited-plain-r161-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdShortfallDepositedPlainR161CopyBtn">复制门槛短差已存</button>`;
      const btn = $("#travelThresholdShortfallDepositedPlainR161CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛短差已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛短差已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+服务类型+医院组合复制 */
  async function ensureAftercareStatusServiceHospitalCopyButtons() {
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
      const status =
        String(
          it.status_label || it.status || it.status_key || it.title || ""
        ).trim() || "未填状态";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const line = status + " · " + service + " · " + hospital;
      el.dataset.statusServiceHospitalR161 = line;
      if (el.querySelector(".ac-copy-status-service-hospital-r161")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-service-hospital-r161";
      btn.textContent = "复制状态服务医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusServiceHospitalR161 || "");
        softBanner(ok ? "已复制状态服务医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+完成态+就绪组合复制 */
  async function ensureAuthDurationHintCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintCompleteReadyCopyR161Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintCompleteReadyCopyR161Card";
      card.className = "av-duration-hint-complete-ready-copy-r161";
      const missComplete = $("#avMissingCompleteReadyCopyR160Card");
      const readyDur = $("#avReadyDurationHintMissingCopyR159Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR158Card");
      if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = duration + " · " + complete + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-complete-ready-copy-r161-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintCompleteReadyCopyR161Btn">复制时长完成就绪</button>`;
      const btn = $("#avDurationHintCompleteReadyCopyR161Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长完成就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+姓名+口令提示组合复制 */
  async function ensureHeirContactNamePassphraseHintCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const phrase =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = contact + " · " + name + " · " + phrase;
      if (el.querySelector(".bn-copy-contact-name-passphrase-hint-r161"))
        return;
      el.dataset.contactNamePassphraseHintR161 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-passphrase-hint-r161";
      btn.textContent = "复制联系姓名口令";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.contactNamePassphraseHintR161 || ""
        );
        softBanner(ok ? "已复制联系姓名口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+域名+完成数组合复制 */
  async function ensureHandoverSectionsDomainDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDomainDoneCopyR161Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDomainDoneCopyR161Card";
      card.className = "hand-sections-domain-done-copy-r161";
      const brandPct = $("#handBrandProgressPctDomainCopyR160Card");
      const pctSec = $("#handProgressPctSectionsDoneCopyR159Card");
      const doneDom = $("#handDoneDomainSectionsCopyR158Card");
      if (brandPct && brandPct.parentNode)
        brandPct.insertAdjacentElement("afterend", card);
      else if (pctSec && pctSec.parentNode)
        pctSec.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
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
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = sectionsCount + " · " + domain + " · " + done;
      const line = "手册章节 · 域名 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-domain-done-copy-r161-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDomainDoneCopyR161Btn">复制章节域名完成</button>`;
      const btn = $("#handSectionsDomainDoneCopyR161Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节域名完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节域名完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+版本+域名+英文品牌四元复制 + round 层含 161 */
  async function paintBrandVersionDomainBrandEnR161CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandVersionDomainBrandEnR161CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandVersionDomainBrandEnR161CopyCard";
      card.className =
        "card settings-brand-version-domain-brand-en-r161-copy-card";
      const verOk = $("#settingsVersionOkBrandEnDomainR160CopyCard");
      const brandEn = $("#settingsBrandEnDomainBrandOkR159CopyCard");
      const brandOk = $("#settingsBrandOkVersionDomainR158CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = brand + " · " + ver + " · " + domain + " · " + en;
      card.innerHTML = `<h3>品牌 · 版本 · 域名 · 英文</h3>
        <p class="muted">一键复制中文品牌、版本、域名与英文品牌（演示级）。</p>
        <p class="settings-brand-version-domain-brand-en-r161-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandVersionDomainBrandEnR161CopyBtn">复制品牌版本域名英文</button>`;
      const btn = $("#settingsBrandVersionDomainBrandEnR161CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌版本域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 版本 · 域名 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList161() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 161;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 161); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round161 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandBrandEnOk().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerTitleIdCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtStatusLabelPlainR161Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdShortfallDepositedPlainR161Copy().catch(
          () => {}
        ),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareStatusServiceHospitalCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintCompleteReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () =>
        ensureHeirContactNamePassphraseHintCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsDomainDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandBrandEnOk().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeviceOwnerTitleIdCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtStatusLabelPlainR161Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdShortfallDepositedPlainR161Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareStatusServiceHospitalCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintCompleteReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirContactNamePassphraseHintCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDomainDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandVersionDomainBrandEnR161CopyCard().catch(() => {});
        paintRoundLayerList161();
      }, 890);
      setTimeout(() => {
        paintBrandVersionDomainBrandEnR161CopyCard().catch(() => {});
        paintRoundLayerList161();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandBrandEnOk().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerTitleIdCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtStatusLabelPlainR161Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdShortfallDepositedPlainR161Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusServiceHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNamePassphraseHintCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDomainDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandVersionDomainBrandEnR161CopyCard().catch(() => {});
      paintRoundLayerList161();
    }, 910);
  }
})();
