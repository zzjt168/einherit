/* 电子继承 · 第二百三十九批增量（叠在 round238…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round239SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+版本+域名冷静条 */
  async function paintHomeBrandEnVersionDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionDomainCalmBarR239");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionDomainCalmBarR239";
      bar.className = "home-brand-en-version-domain-calm-r239";
      bar.setAttribute("role", "status");
      const prev = $("#homeBrandDomainVersionCalmBarR238");
      const prev2 = $("#homeBrandEnBrandDomainCalmBarR237");
      const prev3 = $("#homeVersionDomainBrandCalmBarR236");
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = brandEn + " · " + ver + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r239-mark">英文品牌</span>
        <span class="muted home-brand-en-version-domain-calm-r239-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR239">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR239");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r239-mark">英文品牌</span>
        <span class="muted home-brand-en-version-domain-calm-r239-sub">英文版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR239">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR239");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+标题+设备归属组合复制（三十九进位） */
  async function ensureLegacyDispositionTitleDeviceOwnerCopyButtons() {
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
      const line = disposition + " · " + title + " · " + deviceOwner;
      el.dataset.dispositionTitleDeviceOwnerR239 = line;
      if (el.querySelector(".lg-copy-disposition-title-device-owner-r239")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-title-device-owner-r239";
      btn.textContent = "复制处置标题归属R239";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionTitleDeviceOwnerR239 || "");
        softBanner(ok ? "已复制处置标题归属R239" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+摘要+标签组合复制（三十九进位） */
  async function ensureAssetVisibilitySummaryTagCopyButtons() {
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
      const line = visibility + " · " + summary + " · " + tag;
      el.dataset.visibilitySummaryTagR239 = line;
      if (el.querySelector(".as-copy-visibility-summary-tag-r239")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-summary-tag-r239";
      btn.textContent = "复制可见性摘要标签R239";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilitySummaryTagR239 || ""
        );
        softBanner(ok ? "已复制可见性摘要标签R239" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+下次建议+上次距今（三十九进位） */
  async function ensureCheckinStatusNextSuggestedLastAgoPlainR239Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusNextSuggestedLastAgoPlainR239CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusNextSuggestedLastAgoPlainR239CopyCard";
      card.className =
        "checkin-status-next-suggested-last-ago-plain-r239-copy";
      const prevCk = $(
        "#checkinLastAgoStatusNextSuggestedPlainR238CopyCard"
      );
      const prevCk2 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR237CopyCard"
      );
      const prevCk3 = $(
        "#checkinStatusLastAgoNextSuggestedPlainR236CopyCard"
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
      card.innerHTML = `<p class="muted checkin-status-next-suggested-last-ago-plain-r239-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusNextSuggestedLastAgoPlainR239CopyBtn">复制状态下次距今R239</button>`;
      const btn = $("#checkinStatusNextSuggestedLastAgoPlainR239CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态下次距今R239" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态下次距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+已存三元复制（三十九进位） */
  async function ensureTravelThresholdBalanceDepositedPlainR239Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceDepositedPlainR239CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceDepositedPlainR239CopyCard";
      card.className = "travel-threshold-balance-deposited-plain-r239-copy";
      const prevTr = $(
        "#travelBalanceDepositedThresholdPlainR238CopyCard"
      );
      const prevTr2 = $(
        "#travelDepositedBalanceThresholdPlainR237CopyCard"
      );
      const prevTr3 = $(
        "#travelThresholdDepositedBalancePlainR236CopyCard"
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
      const combo = threshold + " · " + balance + " · " + deposited;
      const line =
        "差旅门槛 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-deposited-plain-r239-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceDepositedPlainR239CopyBtn">复制门槛余额已存R239</button>`;
      const btn = $("#travelThresholdBalanceDepositedPlainR239CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额已存R239" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+科室+城市组合复制（三十九进位） */
  async function ensureAftercareHospitalDepartmentCityCopyButtonsR239() {
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
      const line = hospital + " · " + department + " · " + city;
      el.dataset.hospitalDepartmentCityR239 = line;
      if (el.querySelector(".ac-copy-hospital-department-city-r239"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-department-city-r239";
      btn.textContent = "复制医院科室城市R239";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalDepartmentCityR239 || ""
        );
        softBanner(ok ? "已复制医院科室城市R239" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+时长提示+就绪组合复制（三十九进位） */
  async function ensureAuthCompleteDurationHintReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteDurationHintReadyCopyR239Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteDurationHintReadyCopyR239Card";
      card.className = "av-complete-duration-hint-ready-copy-r239";
      const prevAv = $("#avDurationHintReadyCompleteCopyR238Card");
      const prevAv2 = $("#avReadyDurationHintCompleteCopyR237Card");
      const prevAv3 = $("#avCompleteReadyDurationHintCopyR236Card");
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
      const combo = complete + " · " + duration + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-duration-hint-ready-copy-r239-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteDurationHintReadyCopyR239Btn">复制完成时长就绪R239</button>`;
      const btn = $("#avCompleteDurationHintReadyCopyR239Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成时长就绪R239" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成时长就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系方式+关系组合复制（三十九进位） */
  async function ensureHeirNameContactRelationCopyButtonsR239() {
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
      const line = name + " · " + contact + " · " + relation;
      if (el.querySelector(".bn-copy-name-contact-relation-r239")) return;
      el.dataset.nameContactRelationR239 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-relation-r239";
      btn.textContent = "复制姓名联系关系R239";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContactRelationR239 || "");
        softBanner(ok ? "已复制姓名联系关系R239" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+进度百分比+域名组合复制（三十九进位） */
  async function ensureHandoverDoneProgressPctDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneProgressPctDomainCopyR239Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneProgressPctDomainCopyR239Card";
      card.className = "hand-done-progress-pct-domain-copy-r239";
      const prevHand = $("#handProgressPctDomainDoneCopyR238Card");
      const prevHand2 = $("#handDomainProgressPctDoneCopyR237Card");
      const prevHand3 = $("#handDoneDomainProgressPctCopyR236Card");
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
      const combo = done + " · " + pct + " · " + domain;
      const line = "手册完成 · 进度 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-done-progress-pct-domain-copy-r239-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneProgressPctDomainCopyR239Btn">复制完成进度域名R239</button>`;
      const btn = $("#handDoneProgressPctDomainCopyR239Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成进度域名R239" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成进度域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+英文品牌+版本+就绪四元复制（再进位） + round 层含 239 */
  async function paintDomainBrandEnVersionOkR239CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainBrandEnVersionOkR239CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainBrandEnVersionOkR239CopyCard";
      card.className = "card settings-domain-brand-en-version-ok-r239-copy-card";
      const prevSet = $("#settingsVersionDomainBrandEnOkR238CopyCard");
      const prevSet2 = $("#settingsOkVersionDomainBrandEnR237CopyCard");
      const prevSet3 = $("#settingsBrandEnOkVersionDomainR236CopyCard");
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
      const domain = String(h.domain || "einherit.cn").trim();
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = domain + " · " + brandEn + " · " + ver + " · " + okLabel;
      card.innerHTML = `<h3>域名 · 英文 · 版本 · 就绪</h3>
        <p class="muted">一键复制域名、英文品牌、版本与就绪态（演示级）。</p>
        <p class="settings-domain-brand-en-version-ok-r239-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainBrandEnVersionOkR239CopyBtn">复制域名英文版本就绪R239</button>`;
      const btn = $("#settingsDomainBrandEnVersionOkR239CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名英文版本就绪R239" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 英文 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList239() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 239); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round239 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDispositionTitleDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusNextSuggestedLastAgoPlainR239Copy().catch(
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
        ensureTravelThresholdBalanceDepositedPlainR239Copy().catch(
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
        ensureAftercareHospitalDepartmentCityCopyButtonsR239().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteDurationHintReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactRelationCopyButtonsR239().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneProgressPctDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionTitleDeviceOwnerCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusNextSuggestedLastAgoPlainR239Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceDepositedPlainR239Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentCityCopyButtonsR239().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteDurationHintReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameContactRelationCopyButtonsR239().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneProgressPctDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandEnVersionOkR239CopyCard().catch(() => {});
        paintRoundLayerList239();
      }, 890);
      setTimeout(() => {
        paintDomainBrandEnVersionOkR239CopyCard().catch(() => {});
        paintRoundLayerList239();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDispositionTitleDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilitySummaryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusNextSuggestedLastAgoPlainR239Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceDepositedPlainR239Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentCityCopyButtonsR239().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteDurationHintReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactRelationCopyButtonsR239().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneProgressPctDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandEnVersionOkR239CopyCard().catch(() => {});
      paintRoundLayerList239();
    }, 910);
  }
})();
