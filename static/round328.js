/* 电子继承 · 第三百二十八批增量（叠在 round328…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round328SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+版本+中文品牌冷静条 */
  async function paintHomeDomainVersionBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionBrandCalmBarR328");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionBrandCalmBarR328";
      bar.className = "home-domain-version-brand-calm-r328";
      bar.setAttribute("role", "status");
      const prev = $("#homeDomainVersionBrandCalmBarR327");
      const prev2 = $("#homeDomainVersionBrandCalmBarR326");
      const prev3 = $("#homeDomainVersionBrandCalmBarR325");
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || h.host || "einherit.cn").trim() || "einherit.cn";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + ver + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r328-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r328-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR328">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR328");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r328-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r328-sub">域名版本中文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR328">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR328");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+设备归属+处置组合复制（三百二十八进位） */
  async function ensureLegacyTitleDeviceOwnerDispositionCopyButtons() {
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
      const line = title + " · " + deviceOwner + " · " + disposition;
      el.dataset.titleDeviceOwnerDispositionR328 = line;
      if (el.querySelector(".lg-copy-title-device-owner-disposition-r328")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-device-owner-disposition-r328";
      btn.textContent = "复制标题归属处置R328";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDeviceOwnerDispositionR328 || "");
        softBanner(ok ? "已复制标题归属处置R328" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+摘要+可见性组合复制（三百二十八进位） */
  async function ensureAssetTagSummaryVisibilityCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const line = tag + " · " + summary + " · " + visibility;
      el.dataset.tagSummaryVisibilityR328 = line;
      if (el.querySelector(".as-copy-tag-summary-visibility-r328")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-summary-visibility-r328";
      btn.textContent = "复制标签摘要可见性R328";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.tagSummaryVisibilityR328 || ""
        );
        softBanner(ok ? "已复制标签摘要可见性R328" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次距今+下次建议+状态（三百二十八进位） */
  async function ensureCheckinLastAgoNextSuggestedStatusPlainR328Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoNextSuggestedStatusPlainR328CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoNextSuggestedStatusPlainR328CopyCard";
      card.className =
        "checkin-last-ago-next-suggested-status-plain-r328-copy";
      const prevCk = $(
        "#checkinLastAgoNextSuggestedStatusPlainR327CopyCard"
      );
      const prevCk2 = $(
        "#checkinLastAgoNextSuggestedStatusPlainR326CopyCard"
      );
      const prevCk3 = $(
        "#checkinLastAgoNextSuggestedStatusPlainR325CopyCard"
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
      const combo = lastAgo + " · " + nextAt + " · " + status;
      const line =
        "报备上次距今 · 下次建议 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-next-suggested-status-plain-r328-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoNextSuggestedStatusPlainR328CopyBtn">复制上次距今下次建议状态R328</button>`;
      const btn = $("#checkinLastAgoNextSuggestedStatusPlainR328CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制上次距今下次建议状态R328" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次距今下次建议状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+余额+门槛三元复制（三百二十八进位） */
  async function ensureTravelDepositedBalanceThresholdPlainR328Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedBalanceThresholdPlainR328CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedBalanceThresholdPlainR328CopyCard";
      card.className = "travel-deposited-balance-threshold-plain-r328-copy";
      const prevTr = $(
        "#travelDepositedBalanceThresholdPlainR327CopyCard"
      );
      const prevTr2 = $(
        "#travelDepositedBalanceThresholdPlainR326CopyCard"
      );
      const prevTr3 = $(
        "#travelDepositedBalanceThresholdPlainR325CopyCard"
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
      const combo = deposited + " · " + balance + " · " + threshold;
      const line =
        "差旅已存 · 余额 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-balance-threshold-plain-r328-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedBalanceThresholdPlainR328CopyBtn">复制已存余额门槛R328</button>`;
      const btn = $("#travelDepositedBalanceThresholdPlainR328CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存余额门槛R328" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存余额门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+城市+医院组合复制（三百二十八进位） */
  async function ensureAftercareDepartmentCityHospitalCopyButtonsR328() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = department + " · " + city + " · " + hospital;
      el.dataset.departmentCityHospitalR328 = line;
      if (el.querySelector(".ac-copy-department-city-hospital-r328"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-department-city-hospital-r328";
      btn.textContent = "复制科室城市医院R328";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.departmentCityHospitalR328 || ""
        );
        softBanner(ok ? "已复制科室城市医院R328" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成组合复制（三百二十八进位） */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR328Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR328Card";
      card.className = "av-duration-hint-ready-complete-copy-r328";
      const prevAv = $("#avDurationHintReadyCompleteCopyR327Card");
      const prevAv2 = $("#avDurationHintReadyCompleteCopyR326Card");
      const prevAv3 = $("#avDurationHintReadyCompleteCopyR325Card");
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
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r328-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR328Btn">复制时长就绪完成R328</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR328Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成R328" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+关系+姓名组合复制（三百二十八进位） */
  async function ensureHeirContactRelationNameCopyButtonsR328() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const line = contact + " · " + relation + " · " + name;
      if (el.querySelector(".bn-copy-contact-relation-name-r328")) return;
      el.dataset.contactRelationNameR328 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-relation-name-r328";
      btn.textContent = "复制联系关系姓名R328";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactRelationNameR328 || "");
        softBanner(ok ? "已复制联系关系姓名R328" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+域名组合复制（三百二十八进位） */
  async function ensureHandoverProgressPctDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDoneDomainCopyR328Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDoneDomainCopyR328Card";
      card.className = "hand-progress-pct-done-domain-copy-r328";
      const prevHand = $("#handProgressPctDoneDomainCopyR327Card");
      const prevHand2 = $("#handProgressPctDoneDomainCopyR326Card");
      const prevHand3 = $("#handProgressPctDoneDomainCopyR325Card");
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
      const combo = pct + " · " + done + " · " + domain;
      const line = "手册进度 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-done-domain-copy-r328-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDoneDomainCopyR328Btn">复制进度完成数域名R328</button>`;
      const btn = $("#handProgressPctDoneDomainCopyR328Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成数域名R328" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成进度域名文案暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+版本+英文品牌+中文品牌四元复制（再进位） + round 层含 300 */
  async function paintOkVersionBrandEnBrandR328CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionBrandEnBrandR328CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionBrandEnBrandR328CopyCard";
      card.className = "card settings-ok-version-brand-en-brand-r328-copy-card";
      const prevSet = $("#settingsOkVersionBrandEnBrandR327CopyCard");
      const prevSet2 = $("#settingsOkVersionBrandEnBrandR326CopyCard");
      const prevSet3 = $("#settingsOkVersionBrandEnBrandR325CopyCard");
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
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + ver + " · " + brandEn + " · " + brand;
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 中文</h3>
        <p class="muted">一键复制就绪态、版本、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-ok-version-brand-en-brand-r328-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionBrandEnBrandR328CopyBtn">复制就绪版本英文中文R328</button>`;
      const btn = $("#settingsOkVersionBrandEnBrandR328CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本英文中文R328" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 中文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList328() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 328); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round328 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDeviceOwnerDispositionCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetTagSummaryVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinLastAgoNextSuggestedStatusPlainR328Copy().catch(
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
        ensureTravelDepositedBalanceThresholdPlainR328Copy().catch(
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
        ensureAftercareDepartmentCityHospitalCopyButtonsR328().catch(
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
      () => ensureHeirContactRelationNameCopyButtonsR328().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDeviceOwnerDispositionCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetTagSummaryVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinLastAgoNextSuggestedStatusPlainR328Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedBalanceThresholdPlainR328Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentCityHospitalCopyButtonsR328().catch(
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
        () => ensureHeirContactRelationNameCopyButtonsR328().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionBrandEnBrandR328CopyCard().catch(() => {});
        paintRoundLayerList328();
      }, 890);
      setTimeout(() => {
        paintOkVersionBrandEnBrandR328CopyCard().catch(() => {});
        paintRoundLayerList328();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleDeviceOwnerDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagSummaryVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoNextSuggestedStatusPlainR328Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedBalanceThresholdPlainR328Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityHospitalCopyButtonsR328().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactRelationNameCopyButtonsR328().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionBrandEnBrandR328CopyCard().catch(() => {});
      paintRoundLayerList328();
    }, 910);
  }
})();