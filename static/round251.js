/* 电子继承 · 第二百五十一批增量（叠在 round251…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round251SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+域名+中文品牌冷静条 */
  async function paintHomeVersionDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionDomainBrandCalmBarR251");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionDomainBrandCalmBarR251";
      bar.className = "home-version-domain-brand-calm-r251";
      bar.setAttribute("role", "status");
      const prev = $("#homeBrandBrandEnOkCalmBarR250");
      const prev2 = $("#homeOkDomainVersionCalmBarR249");
      const prev3 = $("#homeBrandEnVersionBrandCalmBarR248");
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
      const version = String(h.version || h.server_version || "").trim() || "版本未标注";
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = version + " · " + domain + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-brand-calm-r251-mark">版本</span>
        <span class="muted home-version-domain-brand-calm-r251-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainBrandCalmGoR251">去设置</button>`;
      const btn = $("#homeVersionDomainBrandCalmGoR251");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-brand-calm-r251-mark">版本</span>
        <span class="muted home-version-domain-brand-calm-r251-sub">版本域名品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainBrandCalmGoR251">去设置</button>`;
      const btn = $("#homeVersionDomainBrandCalmGoR251");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+设备归属+标题组合复制（五十一进位） */
  async function ensureLegacyDispositionDeviceOwnerTitleCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const deviceOwner =
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const line = disposition + " · " + deviceOwner + " · " + title;
      el.dataset.dispositionDeviceOwnerTitleR251 = line;
      if (el.querySelector(".lg-copy-disposition-device-owner-title-r251")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-device-owner-title-r251";
      btn.textContent = "复制处置归属标题R251";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionDeviceOwnerTitleR251 || "");
        softBanner(ok ? "已复制处置归属标题R251" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+标签+摘要组合复制（五十一进位） */
  async function ensureAssetVisibilityTagSummaryCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const line = visibility + " · " + tag + " · " + summary;
      el.dataset.visibilityTagSummaryR251 = line;
      if (el.querySelector(".as-copy-visibility-tag-summary-r251")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-tag-summary-r251";
      btn.textContent = "复制可见性标签摘要R251";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilityTagSummaryR251 || ""
        );
        softBanner(ok ? "已复制可见性标签摘要R251" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+上次距今+下次建议（五十一进位） */
  async function ensureCheckinStatusLastAgoNextSuggestedPlainR251Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLastAgoNextSuggestedPlainR251CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLastAgoNextSuggestedPlainR251CopyCard";
      card.className =
        "checkin-status-last-ago-next-suggested-plain-r251-copy";
      const prevCk = $(
        "#checkinLastAgoNextSuggestedStatusPlainR250CopyCard"
      );
      const prevCk2 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR249CopyCard"
      );
      const prevCk3 = $(
        "#checkinStatusLastAgoNextSuggestedPlainR248CopyCard"
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
      const combo = status + " · " + lastAgo + " · " + nextAt;
      const line =
        "报备状态 · 上次距今 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-last-ago-next-suggested-plain-r251-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLastAgoNextSuggestedPlainR251CopyBtn">复制状态距今下次R251</button>`;
      const btn = $("#checkinStatusLastAgoNextSuggestedPlainR251CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距今下次R251" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距今下次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+已存+余额三元复制（五十一进位） */
  async function ensureTravelThresholdDepositedBalancePlainR251Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdDepositedBalancePlainR251CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdDepositedBalancePlainR251CopyCard";
      card.className = "travel-threshold-deposited-balance-plain-r251-copy";
      const prevTr = $(
        "#travelDepositedBalanceThresholdPlainR250CopyCard"
      );
      const prevTr2 = $(
        "#travelBalanceThresholdDepositedPlainR249CopyCard"
      );
      const prevTr3 = $(
        "#travelThresholdDepositedBalancePlainR248CopyCard"
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
      const combo = threshold + " · " + deposited + " · " + balance;
      const line =
        "差旅门槛 · 已存 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-deposited-balance-plain-r251-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdDepositedBalancePlainR251CopyBtn">复制门槛已存余额R251</button>`;
      const btn = $("#travelThresholdDepositedBalancePlainR251CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛已存余额R251" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+城市+科室组合复制（五十一进位） */
  async function ensureAftercareHospitalCityDepartmentCopyButtonsR251() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = hospital + " · " + city + " · " + department;
      el.dataset.hospitalCityDepartmentR251 = line;
      if (el.querySelector(".ac-copy-hospital-city-department-r251"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-city-department-r251";
      btn.textContent = "复制医院城市科室R251";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalCityDepartmentR251 || ""
        );
        softBanner(ok ? "已复制医院城市科室R251" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+就绪+时长提示组合复制（五十一进位） */
  async function ensureAuthCompleteReadyDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyDurationHintCopyR251Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyDurationHintCopyR251Card";
      card.className = "av-complete-ready-duration-hint-copy-r251";
      const prevAv = $("#avDurationHintCompleteReadyCopyR250Card");
      const prevAv2 = $("#avReadyDurationHintCompleteCopyR249Card");
      const prevAv3 = $("#avCompleteReadyDurationHintCopyR248Card");
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
      const combo = complete + " · " + ready + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-duration-hint-copy-r251-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyDurationHintCopyR251Btn">复制完成就绪时长R251</button>`;
      const btn = $("#avCompleteReadyDurationHintCopyR251Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪时长R251" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+联系方式组合复制（五十一进位） */
  async function ensureHeirNameRelationContactCopyButtonsR251() {
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
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = name + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-name-relation-contact-r251")) return;
      el.dataset.nameRelationContactR251 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-contact-r251";
      btn.textContent = "复制姓名关系联系R251";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationContactR251 || "");
        softBanner(ok ? "已复制姓名关系联系R251" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+进度百分比组合复制（五十一进位） */
  async function ensureHandoverDoneDomainProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainProgressPctCopyR251Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainProgressPctCopyR251Card";
      card.className = "hand-done-domain-progress-pct-copy-r251";
      const prevHand = $("#handProgressPctDoneDomainCopyR250Card");
      const prevHand2 = $("#handDomainProgressPctDoneCopyR249Card");
      const prevHand3 = $("#handDoneDomainProgressPctCopyR248Card");
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
      const combo = done + " · " + domain + " · " + pct;
      const line = "手册完成 · 域名 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-progress-pct-copy-r251-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainProgressPctCopyR251Btn">复制完成域名进度R251</button>`;
      const btn = $("#handDoneDomainProgressPctCopyR251Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名进度R251" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+域名+英文品牌+就绪四元复制（再进位） + round 层含 242 */
  async function paintVersionDomainBrandEnOkR251CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionDomainBrandEnOkR251CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionDomainBrandEnOkR251CopyCard";
      card.className = "card settings-version-domain-brand-en-ok-r251-copy-card";
      const prevSet = $("#settingsBrandEnOkBrandDomainR250CopyCard");
      const prevSet2 = $("#settingsDomainOkVersionBrandR249CopyCard");
      const prevSet3 = $("#settingsVersionBrandBrandEnOkR248CopyCard");
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = ver + " · " + domain + " · " + brandEn + " · " + okLabel;
      card.innerHTML = `<h3>版本 · 域名 · 英文 · 就绪</h3>
        <p class="muted">一键复制版本、域名、英文品牌与就绪态（演示级）。</p>
        <p class="settings-version-domain-brand-en-ok-r251-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionDomainBrandEnOkR251CopyBtn">复制版本域名英文就绪R251</button>`;
      const btn = $("#settingsVersionDomainBrandEnOkR251CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名英文就绪R251" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 英文 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList251() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 242); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round251 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusLastAgoNextSuggestedPlainR251Copy().catch(
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
        ensureTravelThresholdDepositedBalancePlainR251Copy().catch(
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
        ensureAftercareHospitalCityDepartmentCopyButtonsR251().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationContactCopyButtonsR251().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusLastAgoNextSuggestedPlainR251Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdDepositedBalancePlainR251Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalCityDepartmentCopyButtonsR251().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationContactCopyButtonsR251().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainBrandEnOkR251CopyCard().catch(() => {});
        paintRoundLayerList251();
      }, 890);
      setTimeout(() => {
        paintVersionDomainBrandEnOkR251CopyCard().catch(() => {});
        paintRoundLayerList251();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionDeviceOwnerTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLastAgoNextSuggestedPlainR251Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdDepositedBalancePlainR251Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalCityDepartmentCopyButtonsR251().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationContactCopyButtonsR251().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainBrandEnOkR251CopyCard().catch(() => {});
      paintRoundLayerList251();
    }, 910);
  }
})();
