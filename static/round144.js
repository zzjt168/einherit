/* 电子继承 · 第一百四十四批增量（叠在 round143…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round144SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+中文品牌+版本冷静条 */
  async function paintHomeOkBrandVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandVersionCalmBarR144");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandVersionCalmBarR144";
      bar.className = "home-ok-brand-version-calm-r144";
      bar.setAttribute("role", "status");
      const brandVer = $("#homeBrandVersionBrandEnCalmBarR143");
      const enOk = $("#homeBrandEnOkDomainCalmBarR142");
      const verBrand = $("#homeVersionBrandOkCalmBarR141");
      if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (enOk && enOk.parentNode === home)
        enOk.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = ready + " · " + brand + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-version-calm-r144-mark">就绪</span>
        <span class="muted home-ok-brand-version-calm-r144-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandVersionCalmGoR144">去设置</button>`;
      const btn = $("#homeOkBrandVersionCalmGoR144");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-version-calm-r144-mark">就绪</span>
        <span class="muted home-ok-brand-version-calm-r144-sub">就绪品牌版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandVersionCalmGoR144">去设置</button>`;
      const btn = $("#homeOkBrandVersionCalmGoR144");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+处置+状态组合复制 */
  async function ensureLegacyDeviceOwnerDispositionStatusCopyButtons() {
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
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const line = owner + " · " + disposition + " · " + status;
      el.dataset.deviceOwnerDispositionStatus = line;
      if (el.querySelector(".lg-copy-device-owner-disposition-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-disposition-status";
      btn.textContent = "复制归属处置状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerDispositionStatus || "");
        softBanner(ok ? "已复制归属处置状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标题+可见性+处置说明组合复制 */
  async function ensureAssetTitleVisibilityDisposeCopyButtons() {
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
      const title =
        String(it.title || it.platform || "").trim() || "无标题";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const dispose =
        String(it.dispose_note || "").trim() || "未填处置";
      const line = title + " · " + visibility + " · " + dispose;
      el.dataset.titleVisibilityDispose = line;
      if (el.querySelector(".as-copy-title-visibility-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-title-visibility-dispose";
      btn.textContent = "复制标题可见处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleVisibilityDispose || "");
        softBanner(ok ? "已复制标题可见处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+下次建议 */
  async function ensureCheckinStatusLabelNextAtPlainR144Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelNextAtPlainR144CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelNextAtPlainR144CopyCard";
      card.className = "checkin-status-label-next-at-plain-r144-copy";
      const nextWin = $("#checkinNextAtWindowEndsPlainR143CopyCard");
      const lastStatus = $("#checkinLastAgoStatusLabelPlainR142CopyCard");
      const winNext = $("#checkinWindowEndsNextAtPlainR141CopyCard");
      if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const combo = statusLabel + " · " + nextAt;
      const line =
        "报备状态 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-next-at-plain-r144-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelNextAtPlainR144CopyBtn">复制状态下次R144</button>`;
      const btn = $("#checkinStatusLabelNextAtPlainR144CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态下次R144" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+达标+门槛三元复制 */
  async function ensureTravelBalanceMetThresholdPlainR144Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceMetThresholdPlainR144CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceMetThresholdPlainR144CopyCard";
      card.className = "travel-balance-met-threshold-plain-r144-copy";
      const shortThr = $("#travelShortfallThresholdProgressPlainR143CopyCard");
      const metDep = $("#travelMetDepositedProgressPlainR142CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR141CopyCard");
      if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (metDep && metDep.parentNode)
        metDep.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = bal + " · " + met + " · " + thr;
      const line =
        "差旅余额 · 达标 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-met-threshold-plain-r144-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceMetThresholdPlainR144CopyBtn">复制余额达标门槛</button>`;
      const btn = $("#travelBalanceMetThresholdPlainR144CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额达标门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额达标门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+服务类型+城市组合复制 */
  async function ensureAftercareIdServiceCityCopyButtons() {
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
      const id = String(it.id);
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + id + " · " + service + " · " + city;
      el.dataset.idServiceCity = line;
      if (el.querySelector(".ac-copy-id-service-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-service-city";
      btn.textContent = "复制编号服务城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idServiceCity || "");
        softBanner(ok ? "已复制编号服务城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+标题+缺失项组合复制 */
  async function ensureAuthReadyTitleMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyTitleMissingCopyR144Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyTitleMissingCopyR144Card";
      card.className = "av-ready-title-missing-copy-r144";
      const durComplete = $("#avDurationCompleteTitleCopyR143Card");
      const completeReady = $("#avCompleteReadyMissingCopyR142Card");
      const titleMiss = $("#avTitleMissingDurationCopyR141Card");
      if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (titleMiss && titleMiss.parentNode)
        titleMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const latest = data.latest || {};
      const script0 = Array.isArray(data.script) ? data.script[0] : null;
      const title =
        String(
          data.title ||
            latest.original_name ||
            latest.active_label ||
            (script0 && script0.title) ||
            ""
        ).trim() || "授权视频";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const combo = ready + " · " + title + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-title-missing-copy-r144-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyTitleMissingCopyR144Btn">复制就绪标题缺失</button>`;
      const btn = $("#avReadyTitleMissingCopyR144Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪标题缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪标题缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+关系+联系方式组合复制 */
  async function ensureHeirPassphraseRelationContactCopyButtons() {
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
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = passphrase + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-passphrase-relation-contact")) return;
      el.dataset.passphraseRelationContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-relation-contact";
      btn.textContent = "复制口令关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseRelationContact || "");
        softBanner(ok ? "已复制口令关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+品牌+章节数组合复制 */
  async function ensureHandoverDoneBrandSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneBrandSectionsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneBrandSectionsCopyCard";
      card.className = "hand-done-brand-sections-copy";
      const domSec = $("#handDomainSectionsProgressCopyCard");
      const progBrand = $("#handProgressBrandDoneCopyCard");
      const secDone = $("#handSectionsDoneDomainCopyCard");
      if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (progBrand && progBrand.parentNode)
        progBrand.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = done + " · " + brand + " · " + sectionsCount;
      const line = "手册完成 · 品牌 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-done-brand-sections-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneBrandSectionsCopyBtn">复制完成品牌章节</button>`;
      const btn = $("#handDoneBrandSectionsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成品牌章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成品牌章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+中文品牌+版本四元复制 + round 层含 144 */
  async function paintOkBrandEnBrandVersionR144CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandEnBrandVersionR144CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandEnBrandVersionR144CopyCard";
      card.className = "card settings-ok-brand-en-brand-version-r144-copy-card";
      const brandVer = $("#settingsBrandVersionBrandEnDomainR143CopyCard");
      const enDom = $("#settingsBrandEnDomainOkVersionR142CopyCard");
      const domBrand = $("#settingsDomainBrandVersionOkR141CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (enDom && enDom.parentNode)
        enDom.insertAdjacentElement("beforebegin", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = ready + " · " + en + " · " + brand + " · " + ver;
      card.innerHTML = `<h3>就绪 · 英文 · 品牌 · 版本</h3>
        <p class="muted">一键复制就绪状态、英文品牌、中文品牌与版本（演示级）。</p>
        <p class="settings-ok-brand-en-brand-version-r144-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandEnBrandVersionR144CopyBtn">复制就绪英文品牌版本</button>`;
      const btn = $("#settingsOkBrandEnBrandVersionR144CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文品牌版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文 · 品牌 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList144() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 144;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 144); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round144 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandVersion().catch(() => {}), 910);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDeviceOwnerDispositionStatusCopyButtons().catch(() => {}),
      740
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTitleVisibilityDisposeCopyButtons().catch(() => {}),
      740
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelNextAtPlainR144Copy().catch(() => {}),
      730
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceMetThresholdPlainR144Copy().catch(() => {}),
      750
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdServiceCityCopyButtons().catch(() => {}),
      740
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyTitleMissingCopy().catch(() => {}),
      710
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseRelationContactCopyButtons().catch(() => {}),
      740
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneBrandSectionsCopy().catch(() => {}),
      750
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandVersion().catch(() => {}), 910);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerDispositionStatusCopyButtons().catch(
            () => {}
          ),
        760
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTitleVisibilityDisposeCopyButtons().catch(() => {}),
        750
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinStatusLabelNextAtPlainR144Copy().catch(() => {}),
        750
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceMetThresholdPlainR144Copy().catch(() => {}),
        770
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdServiceCityCopyButtons().catch(() => {}),
        760
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyTitleMissingCopy().catch(() => {}),
        730
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseRelationContactCopyButtons().catch(() => {}),
        750
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneBrandSectionsCopy().catch(() => {}),
        760
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnBrandVersionR144CopyCard().catch(() => {});
        paintRoundLayerList144();
      }, 800);
      setTimeout(() => {
        paintOkBrandEnBrandVersionR144CopyCard().catch(() => {});
        paintRoundLayerList144();
      }, 1480);
    }
  };

  setTimeout(() => paintHomeOkBrandVersion().catch(() => {}), 960);
  setTimeout(
    () =>
      ensureLegacyDeviceOwnerDispositionStatusCopyButtons().catch(() => {}),
    980
  );
  setTimeout(
    () => ensureAssetTitleVisibilityDisposeCopyButtons().catch(() => {}),
    1000
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelNextAtPlainR144Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceMetThresholdPlainR144Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdServiceCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyTitleMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneBrandSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnBrandVersionR144CopyCard().catch(() => {});
      paintRoundLayerList144();
    }, 820);
  }
})();
