/* 电子继承 · 第一百五十五批增量（叠在 round154…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round155SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+版本+就绪冷静条 */
  async function paintHomeBrandEnVersionOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionOkCalmBarR155");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionOkCalmBarR155";
      bar.className = "home-brand-en-version-ok-calm-r155";
      bar.setAttribute("role", "status");
      const okDom = $("#homeOkDomainBrandCalmBarR154");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR153");
      const enOk = $("#homeBrandEnOkDomainCalmBarR152");
      if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (enOk && enOk.parentNode === home)
        enOk.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = en + " · " + ver + " · " + okLabel;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-ok-calm-r155-mark">英文</span>
        <span class="muted home-brand-en-version-ok-calm-r155-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionOkCalmGoR155">去设置</button>`;
      const btn = $("#homeBrandEnVersionOkCalmGoR155");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-ok-calm-r155-mark">英文</span>
        <span class="muted home-brand-en-version-ok-calm-r155-sub">英文版本就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionOkCalmGoR155">去设置</button>`;
      const btn = $("#homeBrandEnVersionOkCalmGoR155");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+编号+受益人组合复制 */
  async function ensureLegacyDeviceOwnerIdBeneficiaryCopyButtons() {
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
      const id = it.id != null ? String(it.id) : "—";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const line = owner + " · " + id + " · " + beneficiary;
      el.dataset.deviceOwnerIdBeneficiary = line;
      if (el.querySelector(".lg-copy-device-owner-id-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-id-beneficiary";
      btn.textContent = "复制归属编号受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerIdBeneficiary || "");
        softBanner(ok ? "已复制归属编号受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标签+可见性组合复制 */
  async function ensureAssetPlatformTagVisibilityCopyButtons() {
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
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const tag = String(it.tag || "").trim() || "未填标签";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const line = platform + " · " + tag + " · " + visibility;
      el.dataset.platformTagVisibilityR155 = line;
      if (el.querySelector(".as-copy-platform-tag-visibility-r155")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-tag-visibility-r155";
      btn.textContent = "复制平台标签可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTagVisibilityR155 || "");
        softBanner(ok ? "已复制平台标签可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止 */
  async function ensureCheckinNextAtWindowEndsPlainR155Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtWindowEndsPlainR155CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtWindowEndsPlainR155CopyCard";
      card.className = "checkin-next-at-window-ends-plain-r155-copy";
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR154CopyCard");
      const nextLast = $("#checkinNextAtLastAgoPlainR153CopyCard");
      const winLast = $("#checkinWindowEndsLastAgoPlainR152CopyCard");
      if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
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
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const combo = nextAt + " · " + windowEnds;
      const line =
        "报备下次建议 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-window-ends-plain-r155-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtWindowEndsPlainR155CopyBtn">复制下次窗口R155</button>`;
      const btn = $("#checkinNextAtWindowEndsPlainR155CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次窗口R155" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+已存+余额三元复制 */
  async function ensureTravelThresholdDepositedBalancePlainR155Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdDepositedBalancePlainR155CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdDepositedBalancePlainR155CopyCard";
      card.className = "travel-threshold-deposited-balance-plain-r155-copy";
      const shortBal = $("#travelShortfallBalanceDepositedPlainR154CopyCard");
      const balThr = $("#travelBalanceThresholdProgressPlainR153CopyCard");
      const progShort = $("#travelProgressShortfallDepositedPlainR152CopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (progShort && progShort.parentNode)
        progShort.insertAdjacentElement("afterend", card);
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
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = thr + " · " + deposited + " · " + bal;
      const line =
        "差旅门槛 · 已存 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-deposited-balance-plain-r155-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdDepositedBalancePlainR155CopyBtn">复制门槛已存余额</button>`;
      const btn = $("#travelThresholdDepositedBalancePlainR155CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛已存余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛已存余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+医院+服务类型组合复制 */
  async function ensureAftercareStatusHospitalServiceCopyButtons() {
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
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = status + " · " + hospital + " · " + service;
      el.dataset.statusHospitalService = line;
      if (el.querySelector(".ac-copy-status-hospital-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-hospital-service";
      btn.textContent = "复制状态医院服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusHospitalService || "");
        softBanner(ok ? "已复制状态医院服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+时长提示+缺失项组合复制 */
  async function ensureAuthCompleteDurationHintMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteDurationHintMissingCopyR155Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteDurationHintMissingCopyR155Card";
      card.className = "av-complete-duration-hint-missing-copy-r155";
      const durMiss = $("#avDurationHintMissingReadyCopyR154Card");
      const missReady = $("#avMissingReadyCompleteCopyR153Card");
      const readyComplete = $("#avReadyCompleteDurationCopyR152Card");
      if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const combo = complete + " · " + duration + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-duration-hint-missing-copy-r155-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteDurationHintMissingCopyR155Btn">复制完成时长缺失</button>`;
      const btn = $("#avCompleteDurationHintMissingCopyR155Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成时长缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成时长缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系方式+口令提示组合复制 */
  async function ensureHeirNameContactPassphraseHintCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const phrase =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = name + " · " + contact + " · " + phrase;
      if (el.querySelector(".bn-copy-name-contact-passphrase-hint-r155")) return;
      el.dataset.nameContactPassphraseHintR155 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-passphrase-hint-r155";
      btn.textContent = "复制姓名联系口令";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.nameContactPassphraseHintR155 || ""
        );
        softBanner(ok ? "已复制姓名联系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+进度百分比+品牌组合复制 */
  async function ensureHandoverDoneProgressPctBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneProgressPctBrandCopyR155Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneProgressPctBrandCopyR155Card";
      card.className = "hand-done-progress-pct-brand-copy-r155";
      const pctDom = $("#handProgressPctDomainSectionsCopyR154Card");
      const brandSec = $("#handBrandSectionsDoneCopyCard");
      const secDone = $("#handSectionsDonePctCopyCard");
      if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else if (brandSec && brandSec.parentNode)
        brandSec.insertAdjacentElement("afterend", card);
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
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const combo = done + " · " + pct + " · " + brand;
      const line = "手册完成 · 进度 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-done-progress-pct-brand-copy-r155-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneProgressPctBrandCopyR155Btn">复制完成进度品牌</button>`;
      const btn = $("#handDoneProgressPctBrandCopyR155Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成进度品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成进度品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+英文品牌+就绪+中文品牌四元复制 + round 层含 155 */
  async function paintVersionBrandEnOkBrandR155CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionBrandEnOkBrandR155CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionBrandEnOkBrandR155CopyCard";
      card.className = "card settings-version-brand-en-ok-brand-r155-copy-card";
      const okBrand = $("#settingsOkBrandDomainVersionR154CopyCard");
      const brandEn = $("#settingsBrandEnBrandVersionDomainR153CopyCard");
      const brandDom = $("#settingsBrandDomainVersionOkR152CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = ver + " · " + en + " · " + okLabel + " · " + brand;
      card.innerHTML = `<h3>版本 · 英文 · 就绪 · 品牌</h3>
        <p class="muted">一键复制版本、英文品牌、就绪态与中文品牌（演示级）。</p>
        <p class="settings-version-brand-en-ok-brand-r155-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionBrandEnOkBrandR155CopyBtn">复制版本英文就绪品牌</button>`;
      const btn = $("#settingsVersionBrandEnOkBrandR155CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本英文就绪品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 英文 · 就绪 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList155() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 155;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 155); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round155 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersionOk().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerIdBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTagVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtWindowEndsPlainR155Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdDepositedBalancePlainR155Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusHospitalServiceCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteDurationHintMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactPassphraseHintCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneProgressPctBrandCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersionOk().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerIdBeneficiaryCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTagVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtWindowEndsPlainR155Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdDepositedBalancePlainR155Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareStatusHospitalServiceCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteDurationHintMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirNameContactPassphraseHintCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneProgressPctBrandCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionBrandEnOkBrandR155CopyCard().catch(() => {});
        paintRoundLayerList155();
      }, 890);
      setTimeout(() => {
        paintVersionBrandEnOkBrandR155CopyCard().catch(() => {});
        paintRoundLayerList155();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionOk().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerIdBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetPlatformTagVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtWindowEndsPlainR155Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdDepositedBalancePlainR155Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusHospitalServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteDurationHintMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactPassphraseHintCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneProgressPctBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionBrandEnOkBrandR155CopyCard().catch(() => {});
      paintRoundLayerList155();
    }, 910);
  }
})();
