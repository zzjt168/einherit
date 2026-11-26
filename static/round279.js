/* 电子继承 · 第二百七十九批增量（叠在 round275…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round279SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+英文品牌+版本冷静条 */
  async function paintHomeOkBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnVersionCalmBarR279");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnVersionCalmBarR279";
      bar.className = "home-ok-brand-en-version-calm-r279";
      bar.setAttribute("role", "status");
      const prev = $("#homeBrandVersionDomainCalmBarR278");
      const prev2 = $("#homeBrandEnDomainOkCalmBarR277");
      const prev3 = $("#homeBrandOkVersionCalmBarR276");
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
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brandEn = String(h.brand_en || h.brandEn || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = okLabel + " · " + brandEn + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-r279-mark">就绪</span>
        <span class="muted home-ok-brand-en-version-calm-r279-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGoR279">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGoR279");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-r279-mark">就绪</span>
        <span class="muted home-ok-brand-en-version-calm-r279-sub">就绪英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGoR279">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGoR279");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置+设备归属组合复制（七十九进位） */
  async function ensureLegacyTitleDispositionDeviceOwnerCopyButtons() {
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
      const line = title + " · " + disposition + " · " + deviceOwner;
      el.dataset.titleDispositionDeviceOwnerR279 = line;
      if (el.querySelector(".lg-copy-title-disposition-device-owner-r279")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-device-owner-r279";
      btn.textContent = "复制标题处置归属R279";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDispositionDeviceOwnerR279 || "");
        softBanner(ok ? "已复制标题处置归属R279" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见性+标签组合复制（七十九进位） */
  async function ensureAssetSummaryVisibilityTagCopyButtons() {
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
      const line = summary + " · " + visibility + " · " + tag;
      el.dataset.summaryVisibilityTagR279 = line;
      if (el.querySelector(".as-copy-summary-visibility-tag-r279")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-visibility-tag-r279";
      btn.textContent = "复制摘要可见性标签R279";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryVisibilityTagR279 || ""
        );
        softBanner(ok ? "已复制摘要可见性标签R279" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+状态+上次距今（七十九进位） */
  async function ensureCheckinNextSuggestedStatusLastAgoPlainR279Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedStatusLastAgoPlainR279CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedStatusLastAgoPlainR279CopyCard";
      card.className =
        "checkin-next-suggested-status-last-ago-plain-r279-copy";
      const prevCk = $(
        "#checkinStatusLastAgoNextSuggestedPlainR278CopyCard"
      );
      const prevCk2 = $(
        "#checkinLastAgoNextSuggestedStatusPlainR277CopyCard"
      );
      const prevCk3 = $(
        "#checkinNextSuggestedStatusLastAgoPlainR276CopyCard"
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
      const combo = nextAt + " · " + status + " · " + lastAgo;
      const line =
        "报备下次建议 · 状态 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-status-last-ago-plain-r279-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedStatusLastAgoPlainR279CopyBtn">复制下次状态距今R279</button>`;
      const btn = $("#checkinNextSuggestedStatusLastAgoPlainR279CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次状态距今R279" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次状态距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+已存三元复制（七十九进位） */
  async function ensureTravelBalanceThresholdDepositedPlainR279Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdDepositedPlainR279CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdDepositedPlainR279CopyCard";
      card.className = "travel-balance-threshold-deposited-plain-r279-copy";
      const prevTr = $(
        "#travelThresholdDepositedBalancePlainR278CopyCard"
      );
      const prevTr2 = $(
        "#travelDepositedBalanceThresholdPlainR277CopyCard"
      );
      const prevTr3 = $(
        "#travelBalanceThresholdDepositedPlainR276CopyCard"
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
      const combo = balance + " · " + threshold + " · " + deposited;
      const line =
        "差旅余额 · 门槛 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-deposited-plain-r279-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdDepositedPlainR279CopyBtn">复制余额门槛已存R279</button>`;
      const btn = $("#travelBalanceThresholdDepositedPlainR279CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛已存R279" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+科室+医院组合复制（七十九进位） */
  async function ensureAftercareCityDepartmentHospitalCopyButtonsR279() {
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
      const line = city + " · " + department + " · " + hospital;
      el.dataset.cityDepartmentHospitalR279 = line;
      if (el.querySelector(".ac-copy-city-department-hospital-r279"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-city-department-hospital-r279";
      btn.textContent = "复制城市科室医院R279";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.cityDepartmentHospitalR279 || ""
        );
        softBanner(ok ? "已复制城市科室医院R279" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+时长提示+完成组合复制（七十九进位） */
  async function ensureAuthReadyDurationHintCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyDurationHintCompleteCopyR279Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyDurationHintCompleteCopyR279Card";
      card.className = "av-ready-duration-hint-complete-copy-r279";
      const prevAv = $("#avCompleteReadyDurationHintCopyR278Card");
      const prevAv2 = $("#avDurationHintCompleteReadyCopyR277Card");
      const prevAv3 = $("#avReadyDurationHintCompleteCopyR276Card");
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
      const combo = ready + " · " + duration + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-duration-hint-complete-copy-r279-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyDurationHintCompleteCopyR279Btn">复制就绪时长完成R279</button>`;
      const btn = $("#avReadyDurationHintCompleteCopyR279Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪时长完成R279" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪时长完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+联系方式+姓名组合复制（七十九进位） */
  async function ensureHeirRelationContactNameCopyButtonsR279() {
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
      const line = relation + " · " + contact + " · " + name;
      if (el.querySelector(".bn-copy-relation-contact-name-r279")) return;
      el.dataset.relationContactNameR279 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-contact-name-r279";
      btn.textContent = "复制关系联系姓名R279";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationContactNameR279 || "");
        softBanner(ok ? "已复制关系联系姓名R279" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+进度百分比+完成数组合复制（七十九进位） */
  async function ensureHandoverDomainProgressPctDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainProgressPctDoneCopyR279Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainProgressPctDoneCopyR279Card";
      card.className = "hand-domain-progress-pct-done-copy-r279";
      const prevHand = $("#handDoneDomainProgressPctCopyR278Card");
      const prevHand2 = $("#handProgressPctDoneDomainCopyR277Card");
      const prevHand3 = $("#handDomainProgressPctDoneCopyR276Card");
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
      const combo = domain + " · " + pct + " · " + done;
      const line = "手册域名 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-progress-pct-done-copy-r279-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainProgressPctDoneCopyR279Btn">复制域名进度完成R279</button>`;
      const btn = $("#handDomainProgressPctDoneCopyR279Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名进度完成R279" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名进度完成文案暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+中文品牌+版本+就绪四元复制（再进位） + round 层含 279 */
  async function paintBrandEnBrandVersionOkR279CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnBrandVersionOkR279CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnBrandVersionOkR279CopyCard";
      card.className = "card settings-brand-en-brand-version-ok-r279-copy-card";
      const prevSet = $("#settingsBrandOkVersionBrandEnR278CopyCard");
      const prevSet2 = $("#settingsVersionBrandEnOkBrandR277CopyCard");
      const prevSet3 = $("#settingsBrandEnBrandOkVersionR276CopyCard");
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = brandEn + " · " + brand + " · " + ver + " · " + okLabel;
      card.innerHTML = `<h3>英文 · 中文 · 版本 · 就绪</h3>
        <p class="muted">一键复制英文品牌、中文品牌、版本与就绪态（演示级）。</p>
        <p class="settings-brand-en-brand-version-ok-r279-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnBrandVersionOkR279CopyBtn">复制英文中文版本就绪R279</button>`;
      const btn = $("#settingsBrandEnBrandVersionOkR279CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文中文版本就绪R279" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 中文 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList279() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 210;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 279); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round279 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDispositionDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetSummaryVisibilityTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedStatusLastAgoPlainR279Copy().catch(
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
        ensureTravelBalanceThresholdDepositedPlainR279Copy().catch(
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
        ensureAftercareCityDepartmentHospitalCopyButtonsR279().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyDurationHintCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationContactNameCopyButtonsR279().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainProgressPctDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionDeviceOwnerCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryVisibilityTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedStatusLastAgoPlainR279Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceThresholdDepositedPlainR279Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityDepartmentHospitalCopyButtonsR279().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyDurationHintCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationContactNameCopyButtonsR279().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainProgressPctDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnBrandVersionOkR279CopyCard().catch(() => {});
        paintRoundLayerList279();
      }, 890);
      setTimeout(() => {
        paintBrandEnBrandVersionOkR279CopyCard().catch(() => {});
        paintRoundLayerList279();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleDispositionDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryVisibilityTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedStatusLastAgoPlainR279Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdDepositedPlainR279Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityDepartmentHospitalCopyButtonsR279().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyDurationHintCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationContactNameCopyButtonsR279().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainProgressPctDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnBrandVersionOkR279CopyCard().catch(() => {});
      paintRoundLayerList279();
    }, 910);
  }
})();
