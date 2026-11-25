/* 电子继承 · 第二百一十四批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round214SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+中文品牌+域名冷静条 */
  async function paintHomeBrandEnBrandDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnBrandDomainCalmBarR214");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnBrandDomainCalmBarR214";
      bar.className = "home-brand-en-brand-domain-calm-r214";
      bar.setAttribute("role", "status");
      const prev = $("#homeVersionDomainBrandEnCalmBarR213");
      const prev2 = $("#homeBrandVersionBrandEnCalmBarR212");
      const prev3 = $("#homeBrandEnDomainBrandCalmBarR211");
      if (prev && prev.parentNode === home)
        prev.insertAdjacentElement("afterend", bar);
      else if (prev2 && prev2.parentNode === home)
        prev2.insertAdjacentElement("afterend", bar);
      else if (prev3 && prev3.parentNode === home)
        prev3.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = brandEn + " · " + brand + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-domain-calm-r214-mark">英文</span>
        <span class="muted home-brand-en-brand-domain-calm-r214-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandDomainCalmGoR214">去设置</button>`;
      const btn = $("#homeBrandEnBrandDomainCalmGoR214");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-domain-calm-r214-mark">英文</span>
        <span class="muted home-brand-en-brand-domain-calm-r214-sub">英文中文域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandDomainCalmGoR214">去设置</button>`;
      const btn = $("#homeBrandEnBrandDomainCalmGoR214");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+处置意向+标题组合复制（十四进位） */
  async function ensureLegacyDeviceOwnerDispositionTitleCopyButtons() {
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
      const deviceOwner =
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const title = String(it.title || "").trim() || "无标题";
      const line = deviceOwner + " · " + disposition + " · " + title;
      el.dataset.deviceOwnerDispositionTitleR214 = line;
      if (el.querySelector(".lg-copy-device-owner-disposition-title-r214")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-disposition-title-r214";
      btn.textContent = "复制归属处置标题R214";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerDispositionTitleR214 || "");
        softBanner(ok ? "已复制归属处置标题R214" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+摘要组合复制（十四进位） */
  async function ensureAssetTagVisibilitySummaryCopyButtons() {
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
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = tag + " · " + visibility + " · " + summary;
      el.dataset.tagVisibilitySummaryR214 = line;
      if (el.querySelector(".as-copy-tag-visibility-summary-r214")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-summary-r214";
      btn.textContent = "复制标签可见性摘要R214";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.tagVisibilitySummaryR214 || ""
        );
        softBanner(ok ? "已复制标签可见性摘要R214" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+下次建议+上次距今（十四进位） */
  async function ensureCheckinStatusNextSuggestedLastAgoPlainR214Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusNextSuggestedLastAgoPlainR214CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusNextSuggestedLastAgoPlainR214CopyCard";
      card.className =
        "checkin-status-next-suggested-last-ago-plain-r214-copy";
      const prevCk = $(
        "#checkinNextSuggestedLastAgoStatusPlainR213CopyCard"
      );
      const prevCk2 = $(
        "#checkinStatusLastAgoNextSuggestedPlainR212CopyCard"
      );
      const prevCk3 = $(
        "#checkinLastAgoNextSuggestedStatusPlainR211CopyCard"
      );
      if (prevCk && prevCk.parentNode)
        prevCk.insertAdjacentElement("afterend", card);
      else if (prevCk2 && prevCk2.parentNode)
        prevCk2.insertAdjacentElement("afterend", card);
      else if (prevCk3 && prevCk3.parentNode)
        prevCk3.insertAdjacentElement("afterend", card);
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
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const combo = status + " · " + nextAt + " · " + lastAgo;
      const line =
        "报备状态 · 下次建议 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-next-suggested-last-ago-plain-r214-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusNextSuggestedLastAgoPlainR214CopyBtn">复制状态下次距今R214</button>`;
      const btn = $("#checkinStatusNextSuggestedLastAgoPlainR214CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态下次距今R214" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态下次距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+已存+门槛三元复制（十四进位） */
  async function ensureTravelBalanceDepositedThresholdPlainR214Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceDepositedThresholdPlainR214CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceDepositedThresholdPlainR214CopyCard";
      card.className = "travel-balance-deposited-threshold-plain-r214-copy";
      const prevTr = $(
        "#travelDepositedThresholdBalancePlainR213CopyCard"
      );
      const prevTr2 = $(
        "#travelThresholdDepositedBalancePlainR212CopyCard"
      );
      const prevTr3 = $(
        "#travelBalanceThresholdDepositedPlainR211CopyCard"
      );
      if (prevTr && prevTr.parentNode)
        prevTr.insertAdjacentElement("afterend", card);
      else if (prevTr2 && prevTr2.parentNode)
        prevTr2.insertAdjacentElement("afterend", card);
      else if (prevTr3 && prevTr3.parentNode)
        prevTr3.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = balance + " · " + deposited + " · " + threshold;
      const line =
        "差旅余额 · 已存 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-deposited-threshold-plain-r214-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceDepositedThresholdPlainR214CopyBtn">复制余额已存门槛R214</button>`;
      const btn = $("#travelBalanceDepositedThresholdPlainR214CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额已存门槛R214" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额已存门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+城市+医院组合复制（十四进位） */
  async function ensureAftercareDepartmentCityHospitalCopyButtonsR214() {
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
        String(it.department || it.dept || "").trim() || "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = department + " · " + city + " · " + hospital;
      el.dataset.departmentCityHospitalR214 = line;
      if (el.querySelector(".ac-copy-department-city-hospital-r214"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-department-city-hospital-r214";
      btn.textContent = "复制科室城市医院R214";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.departmentCityHospitalR214 || ""
        );
        softBanner(ok ? "已复制科室城市医院R214" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成组合复制（十四进位） */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR214Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR214Card";
      card.className = "av-duration-hint-ready-complete-copy-r214";
      const prevAv = $("#avReadyCompleteDurationHintCopyR213Card");
      const prevAv2 = $("#avCompleteReadyDurationHintCopyR212Card");
      const prevAv3 = $("#avDurationHintCompleteReadyCopyR211Card");
      if (prevAv && prevAv.parentNode)
        prevAv.insertAdjacentElement("afterend", card);
      else if (prevAv2 && prevAv2.parentNode)
        prevAv2.insertAdjacentElement("afterend", card);
      else if (prevAv3 && prevAv3.parentNode)
        prevAv3.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete != null
              ? latest.complete
              : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r214-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR214Btn">复制时长就绪完成R214</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR214Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成R214" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+关系+姓名组合复制（十四进位） */
  async function ensureHeirContactRelationNameCopyButtonsR214() {
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
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = contact + " · " + relation + " · " + name;
      if (el.querySelector(".bn-copy-contact-relation-name-r214")) return;
      el.dataset.contactRelationNameR214 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-relation-name-r214";
      btn.textContent = "复制联系关系姓名R214";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRelationNameR214 || "");
        softBanner(ok ? "已复制联系关系姓名R214" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+域名+完成数组合复制（十四进位） */
  async function ensureHandoverProgressPctDomainDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDomainDoneCopyR214Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDomainDoneCopyR214Card";
      card.className = "hand-progress-pct-domain-done-copy-r214";
      const prevHand = $("#handDomainDoneProgressPctCopyR213Card");
      const prevHand2 = $("#handDoneDomainProgressPctCopyR212Card");
      const prevHand3 = $("#handProgressPctDoneDomainCopyR211Card");
      if (prevHand && prevHand.parentNode)
        prevHand.insertAdjacentElement("afterend", card);
      else if (prevHand2 && prevHand2.parentNode)
        prevHand2.insertAdjacentElement("afterend", card);
      else if (prevHand3 && prevHand3.parentNode)
        prevHand3.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
      const pctRaw =
        prog.pct != null
          ? prog.pct
          : prog.percent != null
            ? prog.percent
            : data.progress_pct;
      const pct =
        pctRaw == null
          ? "—"
          : String(pctRaw) + (String(pctRaw).endsWith("%") ? "" : "%");
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = pct + " · " + domain + " · " + done;
      const line = "手册进度 · 域名 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-domain-done-copy-r214-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDomainDoneCopyR214Btn">复制进度域名完成R214</button>`;
      const btn = $("#handProgressPctDomainDoneCopyR214Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度域名完成R214" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度域名完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+版本+中文品牌+域名四元复制（再进位） + round 层含 210 */
  async function paintBrandEnOkVersionBrandR214CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnOkVersionBrandR214CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnOkVersionBrandR214CopyCard";
      card.className = "card settings-brand-en-ok-version-brand-r214-copy-card";
      const prevSet = $("#settingsDomainBrandEnOkVersionR213CopyCard");
      const prevSet2 = $("#settingsBrandDomainBrandEnOkR212CopyCard");
      const prevSet3 = $("#settingsVersionBrandDomainBrandEnR211CopyCard");
      const roundList = $("#roundLayerListCard");
      if (prevSet && prevSet.parentNode)
        prevSet.insertAdjacentElement("beforebegin", card);
      else if (prevSet2 && prevSet2.parentNode)
        prevSet2.insertAdjacentElement("beforebegin", card);
      else if (prevSet3 && prevSet3.parentNode)
        prevSet3.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = brandEn + " · " + okLabel + " · " + ver + " · " + brand;
      card.innerHTML = `<h3>英文 · 就绪 · 版本 · 中文</h3>
        <p class="muted">一键复制英文品牌、就绪态、版本与中文品牌（演示级）。</p>
        <p class="settings-brand-en-ok-version-brand-r214-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnOkVersionBrandR214CopyBtn">复制英文就绪版本中文R214</button>`;
      const btn = $("#settingsBrandEnOkVersionBrandR214CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文就绪版本中文R214" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 就绪 · 版本 · 中文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList214() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 214); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round214 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnBrandDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerDispositionTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetTagVisibilitySummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusNextSuggestedLastAgoPlainR214Copy().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceDepositedThresholdPlainR214Copy().catch(
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
        ensureAftercareDepartmentCityHospitalCopyButtonsR214().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactRelationNameCopyButtonsR214().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDomainDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnBrandDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerDispositionTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetTagVisibilitySummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusNextSuggestedLastAgoPlainR214Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceDepositedThresholdPlainR214Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentCityHospitalCopyButtonsR214().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactRelationNameCopyButtonsR214().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDomainDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnOkVersionBrandR214CopyCard().catch(() => {});
        paintRoundLayerList214();
      }, 890);
      setTimeout(() => {
        paintBrandEnOkVersionBrandR214CopyCard().catch(() => {});
        paintRoundLayerList214();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnBrandDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerDispositionTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagVisibilitySummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusNextSuggestedLastAgoPlainR214Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceDepositedThresholdPlainR214Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityHospitalCopyButtonsR214().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRelationNameCopyButtonsR214().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDomainDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnOkVersionBrandR214CopyCard().catch(() => {});
      paintRoundLayerList214();
    }, 910);
  }
})();
