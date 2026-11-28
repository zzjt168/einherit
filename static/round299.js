/* 电子继承 · 第二百九十九批增量（叠在 round298…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round299SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+中文品牌+域名冷静条 */
  async function paintHomeVersionBrandDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandDomainCalmBarR299");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandDomainCalmBarR299";
      bar.className = "home-version-brand-domain-calm-r299";
      bar.setAttribute("role", "status");
      const prev = $("#homeDomainVersionBrandCalmBarR298");
      const prev2 = $("#homeBrandVersionDomainCalmBarR297");
      const prev3 = $("#homeVersionDomainBrandCalmBarR296");
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || h.host || "einherit.cn").trim() || "einherit.cn";
      const sub = ver + " · " + brand + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-domain-calm-r299-mark">版本</span>
        <span class="muted home-version-brand-domain-calm-r299-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandDomainCalmGoR299">去设置</button>`;
      const btn = $("#homeVersionBrandDomainCalmGoR299");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-domain-calm-r299-mark">版本</span>
        <span class="muted home-version-brand-domain-calm-r299-sub">版本中文域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandDomainCalmGoR299">去设置</button>`;
      const btn = $("#homeVersionBrandDomainCalmGoR299");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+标题+处置组合复制（九十九进位） */
  async function ensureLegacyDeviceOwnerTitleDispositionCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const line = deviceOwner + " · " + title + " · " + disposition;
      el.dataset.deviceOwnerTitleDispositionR299 = line;
      if (el.querySelector(".lg-copy-device-owner-title-disposition-r299")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-title-disposition-r299";
      btn.textContent = "复制归属标题处置R299";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerTitleDispositionR299 || "");
        softBanner(ok ? "已复制归属标题处置R299" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+标签+摘要组合复制（九十九进位） */
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = visibility + " · " + tag + " · " + summary;
      el.dataset.visibilityTagSummaryR299 = line;
      if (el.querySelector(".as-copy-visibility-tag-summary-r299")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-tag-summary-r299";
      btn.textContent = "复制可见性标签摘要R299";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilityTagSummaryR299 || ""
        );
        softBanner(ok ? "已复制可见性标签摘要R299" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+上次距今+下次建议（九十九进位） */
  async function ensureCheckinStatusLastAgoNextSuggestedPlainR299Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLastAgoNextSuggestedPlainR299CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLastAgoNextSuggestedPlainR299CopyCard";
      card.className =
        "checkin-status-last-ago-next-suggested-plain-r299-copy";
      const prevCk = $(
        "#checkinLastAgoNextSuggestedStatusPlainR298CopyCard"
      );
      const prevCk2 = $(
        "#checkinStatusNextSuggestedLastAgoPlainR297CopyCard"
      );
      const prevCk3 = $(
        "#checkinNextSuggestedLastAgoStatusPlainR296CopyCard"
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
      card.innerHTML = `<p class="muted checkin-status-last-ago-next-suggested-plain-r299-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLastAgoNextSuggestedPlainR299CopyBtn">复制状态距今下次R299</button>`;
      const btn = $("#checkinStatusLastAgoNextSuggestedPlainR299CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距今下次R299" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态距今下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+已存+余额三元复制（九十九进位） */
  async function ensureTravelThresholdDepositedBalancePlainR299Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdDepositedBalancePlainR299CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdDepositedBalancePlainR299CopyCard";
      card.className = "travel-threshold-deposited-balance-plain-r299-copy";
      const prevTr = $(
        "#travelDepositedBalanceThresholdPlainR298CopyCard"
      );
      const prevTr2 = $(
        "#travelBalanceDepositedThresholdPlainR297CopyCard"
      );
      const prevTr3 = $(
        "#travelThresholdBalanceDepositedPlainR296CopyCard"
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
      card.innerHTML = `<p class="muted travel-threshold-deposited-balance-plain-r299-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdDepositedBalancePlainR299CopyBtn">复制门槛已存余额R299</button>`;
      const btn = $("#travelThresholdDepositedBalancePlainR299CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛已存余额R299" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛已存余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+科室+城市组合复制（九十九进位） */
  async function ensureAftercareHospitalDepartmentCityCopyButtonsR299() {
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
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const line = hospital + " · " + department + " · " + city;
      el.dataset.hospitalDepartmentCityR299 = line;
      if (el.querySelector(".ac-copy-hospital-department-city-r299"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-department-city-r299";
      btn.textContent = "复制医院科室城市R299";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalDepartmentCityR299 || ""
        );
        softBanner(ok ? "已复制医院科室城市R299" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+就绪+时长提示组合复制（九十九进位） */
  async function ensureAuthCompleteReadyDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyDurationHintCopyR299Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyDurationHintCopyR299Card";
      card.className = "av-complete-ready-duration-hint-copy-r299";
      const prevAv = $("#avDurationHintReadyCompleteCopyR298Card");
      const prevAv2 = $("#avReadyCompleteDurationHintCopyR297Card");
      const prevAv3 = $("#avCompleteDurationHintReadyCopyR296Card");
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
      card.innerHTML = `<p class="muted av-complete-ready-duration-hint-copy-r299-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyDurationHintCopyR299Btn">复制完成就绪时长R299</button>`;
      const btn = $("#avCompleteReadyDurationHintCopyR299Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪时长R299" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪时长文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+联系方式组合复制（九十九进位） */
  async function ensureHeirNameRelationContactCopyButtonsR299() {
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
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = name + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-name-relation-contact-r299")) return;
      el.dataset.nameRelationContactR299 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-contact-r299";
      btn.textContent = "复制姓名关系联系R299";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationContactR299 || "");
        softBanner(ok ? "已复制姓名关系联系R299" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+进度百分比组合复制（九十九进位） */
  async function ensureHandoverDoneDomainProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainProgressPctCopyR299Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainProgressPctCopyR299Card";
      card.className = "hand-done-domain-progress-pct-copy-r299";
      const prevHand = $("#handProgressPctDoneDomainCopyR298Card");
      const prevHand2 = $("#handDomainDoneProgressPctCopyR297Card");
      const prevHand3 = $("#handDoneProgressPctDomainCopyR296Card");
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
      card.innerHTML = `<p class="muted hand-done-domain-progress-pct-copy-r299-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainProgressPctCopyR299Btn">复制完成域名进度R299</button>`;
      const btn = $("#handDoneDomainProgressPctCopyR299Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名进度R299" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成域名进度文案暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+中文品牌+就绪+英文品牌四元复制（再进位） + round 层含 299 */
  async function paintVersionBrandOkBrandEnR299CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionBrandOkBrandEnR299CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionBrandOkBrandEnR299CopyCard";
      card.className = "card settings-version-brand-ok-brand-en-r299-copy-card";
      const prevSet = $("#settingsOkBrandEnVersionBrandR298CopyCard");
      const prevSet2 = $("#settingsBrandOkBrandEnVersionR297CopyCard");
      const prevSet3 = $("#settingsBrandEnBrandVersionOkR296CopyCard");
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const line = ver + " · " + brand + " · " + okLabel + " · " + brandEn;
      card.innerHTML = `<h3>版本 · 中文 · 就绪 · 英文</h3>
        <p class="muted">一键复制版本、中文品牌、就绪态与英文品牌（演示级）。</p>
        <p class="settings-version-brand-ok-brand-en-r299-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionBrandOkBrandEnR299CopyBtn">复制版本中文就绪英文R299</button>`;
      const btn = $("#settingsVersionBrandOkBrandEnR299CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本中文就绪英文R299" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 中文 · 就绪 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList299() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 299); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round299 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
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
        ensureCheckinStatusLastAgoNextSuggestedPlainR299Copy().catch(
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
        ensureTravelThresholdDepositedBalancePlainR299Copy().catch(
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
        ensureAftercareHospitalDepartmentCityCopyButtonsR299().catch(
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
      () => ensureHeirNameRelationContactCopyButtonsR299().catch(() => {}),
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
      setTimeout(() => paintHomeVersionBrandDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
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
          ensureCheckinStatusLastAgoNextSuggestedPlainR299Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdDepositedBalancePlainR299Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentCityCopyButtonsR299().catch(
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
        () => ensureHeirNameRelationContactCopyButtonsR299().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionBrandOkBrandEnR299CopyCard().catch(() => {});
        paintRoundLayerList299();
      }, 890);
      setTimeout(() => {
        paintVersionBrandOkBrandEnR299CopyCard().catch(() => {});
        paintRoundLayerList299();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionBrandDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityTagSummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLastAgoNextSuggestedPlainR299Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdDepositedBalancePlainR299Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentCityCopyButtonsR299().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationContactCopyButtonsR299().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionBrandOkBrandEnR299CopyCard().catch(() => {});
      paintRoundLayerList299();
    }, 910);
  }
})();
