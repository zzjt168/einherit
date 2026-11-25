/* 电子继承 · 第一百七十六批增量（叠在 round175…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round176SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+域名+版本冷静条（进位） */
  async function paintHomeBrandDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandDomainVersionCalmBarR176");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandDomainVersionCalmBarR176";
      bar.className = "home-brand-domain-version-calm-r176";
      bar.setAttribute("role", "status");
      const verDom = $("#homeVersionDomainBrandEnCalmBarR175");
      const brandEnVer = $("#homeBrandEnVersionBrandCalmBarR174");
      const domVer = $("#homeDomainVersionBrandCalmBarR173");
      if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
      else if (brandEnVer && brandEnVer.parentNode === home)
        brandEnVer.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = brand + " · " + domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-version-calm-r176-mark">品牌</span>
        <span class="muted home-brand-domain-version-calm-r176-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainVersionCalmGoR176">去设置</button>`;
      const btn = $("#homeBrandDomainVersionCalmGoR176");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-version-calm-r176-mark">品牌</span>
        <span class="muted home-brand-domain-version-calm-r176-sub">品牌域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainVersionCalmGoR176">去设置</button>`;
      const btn = $("#homeBrandDomainVersionCalmGoR176");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+设备归属+标题组合复制（进位） */
  async function ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填设备归属";
      const title = String(it.title || "").trim() || "无标题";
      const line = beneficiary + " · " + deviceOwner + " · " + title;
      el.dataset.beneficiaryDeviceOwnerTitleR176 = line;
      if (el.querySelector(".lg-copy-beneficiary-device-owner-title-r176"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-beneficiary-device-owner-title-r176";
      btn.textContent = "复制受益人归属标题R176";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.beneficiaryDeviceOwnerTitleR176 || ""
        );
        softBanner(ok ? "已复制受益人归属标题R176" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+分类+摘要组合复制（进位） */
  async function ensureAssetVisibilityCategorySummaryCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = visibility + " · " + category + " · " + summary;
      el.dataset.visibilityCategorySummaryR176 = line;
      if (el.querySelector(".as-copy-visibility-category-summary-r176")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-category-summary-r176";
      btn.textContent = "复制可见性分类摘要R176";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilityCategorySummaryR176 || ""
        );
        softBanner(ok ? "已复制可见性分类摘要R176" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+上次距今（进位） */
  async function ensureCheckinStatusLabelLastAgoPlainR176Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelLastAgoPlainR176CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelLastAgoPlainR176CopyCard";
      card.className = "checkin-status-label-last-ago-plain-r176-copy";
      const lastWin = $("#checkinLastAgoWindowEndsPlainR175CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR174CopyCard");
      const nextStatus = $("#checkinNextSuggestedAtStatusLabelPlainR173CopyCard");
      if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
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
        ).trim() || "暂无状态";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = statusLabel + " · " + lastAgo;
      const line =
        "报备状态 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-last-ago-plain-r176-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelLastAgoPlainR176CopyBtn">复制状态距上次R176</button>`;
      const btn = $("#checkinStatusLabelLastAgoPlainR176CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距上次R176" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+门槛+余额三元复制（再进位） */
  async function ensureTravelShortfallThresholdBalancePlainR176Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdBalancePlainR176CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdBalancePlainR176CopyCard";
      card.className = "travel-shortfall-threshold-balance-plain-r176-copy";
      const thrBal = $("#travelThresholdBalanceDepositedPlainR175CopyCard");
      const balDep = $("#travelBalanceDepositedShortfallPlainR174CopyCard");
      const depShort = $("#travelDepositedShortfallThresholdPlainR173CopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const combo = shortfall + " · " + thr + " · " + balance;
      const line =
        "差旅短差 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-balance-plain-r176-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdBalancePlainR176CopyBtn">复制短差门槛余额R176</button>`;
      const btn = $("#travelShortfallThresholdBalancePlainR176CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差门槛余额R176" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+城市+医院组合复制（再进位） */
  async function ensureAftercareDepartmentCityHospitalCopyButtonsR176() {
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
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = department + " · " + city + " · " + hospital;
      el.dataset.departmentCityHospitalR176 = line;
      if (el.querySelector(".ac-copy-department-city-hospital-r176")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-city-hospital-r176";
      btn.textContent = "复制科室城市医院R176";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentCityHospitalR176 || "");
        softBanner(ok ? "已复制科室城市医院R176" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+缺失项+时长提示组合复制（进位） */
  async function ensureAuthCompleteMissingDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingDurationHintCopyR176Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingDurationHintCopyR176Card";
      card.className = "av-complete-missing-duration-hint-copy-r176";
      const missDur = $("#avMissingDurationHintReadyCopyR175Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR174Card");
      const readyComplete = $("#avReadyCompleteMissingCopyR173Card");
      if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = complete + " · " + missLabel + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-duration-hint-copy-r176-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingDurationHintCopyR176Btn">复制完成缺失时长R176</button>`;
      const btn = $("#avCompleteMissingDurationHintCopyR176Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成缺失时长R176" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成缺失时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+姓名+关系组合复制（再进位） */
  async function ensureHeirContactNameRelationCopyButtonsR176() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-contact-name-relation-r176")) return;
      el.dataset.contactNameRelationR176 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-relation-r176";
      btn.textContent = "复制联系姓名关系R176";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameRelationR176 || "");
        softBanner(ok ? "已复制联系姓名关系R176" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+进度百分比+完成数组合复制（进位） */
  async function ensureHandoverSectionsProgressPctDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsProgressPctDoneCopyR176Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsProgressPctDoneCopyR176Card";
      card.className = "hand-sections-progress-pct-done-copy-r176";
      const pctDone = $("#handProgressPctDoneDomainCopyR175Card");
      const doneDom = $("#handDoneDomainSectionsCopyR174Card");
      const domSec = $("#handDomainSectionsProgressPctCopyR173Card");
      if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.sections != null
            ? String(prog.sections)
            : prog.total_types != null
              ? String(prog.total_types)
              : data.total != null
                ? String(data.total)
                : "—";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = sections + " · " + pct + " · " + done;
      const line = "手册章节 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-progress-pct-done-copy-r176-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsProgressPctDoneCopyR176Btn">复制章节进度完成R176</button>`;
      const btn = $("#handSectionsProgressPctDoneCopyR176Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节进度完成R176" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节进度完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+中文品牌+域名+ok四元复制 + round 层含 176 */
  async function paintBrandEnBrandDomainOkR176CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnBrandDomainOkR176CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnBrandDomainOkR176CopyCard";
      card.className = "card settings-brand-en-brand-domain-ok-r176-copy-card";
      const brandDom = $("#settingsBrandDomainOkVersionR175CopyCard");
      const domOk = $("#settingsDomainOkVersionBrandEnR174CopyCard");
      const okVer = $("#settingsOkVersionBrandEnBrandR173CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · " + brand + " · " + domain + " · " + okLabel;
      card.innerHTML = `<h3>英文 · 品牌 · 域名 · 就绪</h3>
        <p class="muted">一键复制英文品牌、中文品牌、域名与就绪态（演示级）。</p>
        <p class="settings-brand-en-brand-domain-ok-r176-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnBrandDomainOkR176CopyBtn">复制英文品牌域名就绪</button>`;
      const btn = $("#settingsBrandEnBrandDomainOkR176CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文品牌域名就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 品牌 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList176() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 176;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 176); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round176 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilityCategorySummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelLastAgoPlainR176Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallThresholdBalancePlainR176Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareDepartmentCityHospitalCopyButtonsR176().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameRelationCopyButtonsR176().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsProgressPctDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilityCategorySummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusLabelLastAgoPlainR176Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallThresholdBalancePlainR176Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentCityHospitalCopyButtonsR176().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirContactNameRelationCopyButtonsR176().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsProgressPctDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnBrandDomainOkR176CopyCard().catch(() => {});
        paintRoundLayerList176();
      }, 890);
      setTimeout(() => {
        paintBrandEnBrandDomainOkR176CopyCard().catch(() => {});
        paintRoundLayerList176();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandDomainVersion().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyBeneficiaryDeviceOwnerTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityCategorySummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelLastAgoPlainR176Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdBalancePlainR176Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityHospitalCopyButtonsR176().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameRelationCopyButtonsR176().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsProgressPctDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnBrandDomainOkR176CopyCard().catch(() => {});
      paintRoundLayerList176();
    }, 910);
  }
})();
