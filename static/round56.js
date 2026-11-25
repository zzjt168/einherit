/* 电子继承 · 第五十六批增量（叠在 round55…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round56SoftBanner_" + (hostId || "home");
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

  function roleZh(raw) {
    const k = String(raw || "").toLowerCase();
    const map = { heir: "继承人", family: "家人", executor: "执行人" };
    return map[k] || String(raw || "");
  }

  /* 1 · 首页产品域名一句 */
  async function paintHomeDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBar";
      bar.className = "home-domain-bar";
      bar.setAttribute("role", "status");
      const bene = $("#homeBeneCountBar");
      const slogan = $("#homeCompanySloganBar");
      const app = $("#homeAppBrandBar");
      if (bene && bene.parentNode === home)
        bene.insertAdjacentElement("afterend", bar);
      else if (slogan && slogan.parentNode === home)
        slogan.insertAdjacentElement("afterend", bar);
      else if (app && app.parentNode === home)
        app.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health").catch(() => ({}));
      const domain = String(h.domain || "einherit.cn").trim();
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-mark">域名</span>
        <span class="muted home-domain-sub">${esc(domain)} · 产品站点</span>
        <button type="button" class="btn ghost sm" id="homeDomainGo">去设置</button>`;
      const btn = $("#homeDomainGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割处置纯文本一键复制 */
  async function ensureLegacyActionPlainCopyButtons() {
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
      const action = String(it.action || "").trim();
      if (!action || el.querySelector(".lg-copy-action-plain")) return;
      el.dataset.actionPlain = action;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-plain";
      btn.textContent = "复制处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionPlain || "");
        softBanner(ok ? "已复制处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签纯文本一键复制 */
  async function ensureAssetTagPlainCopyButtons() {
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
      const tag = String(it.tag || "").trim();
      if (!tag || el.querySelector(".as-copy-tag-plain")) return;
      el.dataset.tagPlain = tag;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-plain";
      btn.textContent = "复制标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagPlain || "");
        softBanner(ok ? "已复制标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制将到建议时刻状态 */
  async function ensureCheckinDueSoonCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDueSoonCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDueSoonCopyCard";
      card.className = "checkin-due-soon-copy";
      const hours = $("#checkinHoursSinceNumCopyCard");
      const last = $("#checkinLastLabelCopyCard");
      const ago = $("#checkinLastAgoCopyCard");
      if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const due = !!(st.countdown || {}).due_soon;
      const status = due ? "将到建议时刻" : "尚宽裕";
      const line =
        "报备节奏 · " +
        status +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-due-soon-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinDueSoonCopyBtn">复制节奏状态</button>`;
      const btn = $("#checkinDueSoonCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制节奏状态" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">节奏状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近断缴退款备注一键复制 */
  async function ensureTravelRefundNoteCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelRefundNoteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelRefundNoteCopyCard";
      card.className = "travel-refund-note-copy";
      const kind = $("#travelRefundKindCopyCard");
      const bal = $("#travelBalanceThresholdCopyCard");
      const kindLabel = $("#travelLedgerKindLabelCopyCard");
      if (kind && kind.parentNode)
        kind.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode)
        bal.insertAdjacentElement("afterend", card);
      else if (kindLabel && kindLabel.parentNode)
        kindLabel.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const note = String(((fund.last_refund || {}) || {}).note || "").trim();
      if (!note) {
        card.innerHTML = `<p class="muted">暂无断缴退款备注可复制</p>`;
        return;
      }
      const line = "最近断缴退款备注 · " + note;
      card.innerHTML = `<p class="muted travel-refund-note-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelRefundNoteCopyBtn">复制退款备注</button>`;
      const btn = $("#travelRefundNoteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(note);
          softBanner(ok ? "已复制退款备注" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款备注暂不可用</p>`;
    }
  }

  /* 6 · 善后状态英文键一键复制 */
  async function ensureAftercareStatusKeyCopyButtons() {
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
      const key = String(it.status_key || "").trim();
      if (!key || el.querySelector(".ac-copy-status-key")) return;
      el.dataset.statusKey = key;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-key";
      btn.textContent = "复制状态键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusKey || "");
        softBanner(ok ? "已复制状态键" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频首段脚本键一键复制 */
  async function ensureAuthScriptKey0Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptKey0CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptKey0CopyCard";
      card.className = "av-script-key0-copy";
      const total = $("#avProgressTotalNumCopyCard");
      const complete = $("#avCompleteLabelCopyCard");
      const t0 = $("#avScriptTitle0CopyCard");
      if (total && total.parentNode)
        total.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (t0 && t0.parentNode)
        t0.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const key = String((script[0] && script[0].key) || "").trim();
      if (!key) {
        card.innerHTML = `<p class="muted">首段脚本键暂不可用</p>`;
        return;
      }
      const line = "授权视频首段脚本键 · " + key;
      card.innerHTML = `<p class="muted av-script-key0-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptKey0CopyBtn">复制脚本键</button>`;
      const btn = $("#avScriptKey0CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(key);
          softBanner(ok ? "已复制脚本键" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本键暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色中文纯文本一键复制 */
  async function ensureHeirRoleZhCopyButtons() {
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
      if (!it) return;
      const zh = roleZh(it.role);
      if (!zh || el.querySelector(".bn-copy-role-zh")) return;
      el.dataset.roleZh = zh;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-zh";
      btn.textContent = "复制角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleZh || "");
        softBanner(ok ? "已复制角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册销毁条数纯数字一键复制 */
  async function ensureHandoverDestroyCountNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDestroyCountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDestroyCountNumCopyCard";
      card.className = "hand-destroy-count-num-copy";
      const gift = $("#handGiftCountNumCopyCard");
      const executor = $("#handExecutorCopyCard");
      const pct = $("#handProgressPctNumCopyCard");
      if (gift && gift.parentNode)
        gift.insertAdjacentElement("afterend", card);
      else if (executor && executor.parentNode)
        executor.insertAdjacentElement("afterend", card);
      else if (pct && pct.parentNode)
        pct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let destroy = (prog.action_counts || {}).destroy;
      if (destroy == null && Array.isArray(prog.by_action)) {
        const row = prog.by_action.find(
          (x) => String(x.action || "") === "销毁"
        );
        if (row) destroy = row.count;
      }
      if (destroy == null) {
        card.innerHTML = `<p class="muted">销毁条数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(destroy)));
      const line = "手册销毁条数 · " + num;
      card.innerHTML = `<p class="muted hand-destroy-count-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDestroyCountNumCopyBtn">复制销毁条数</button>`;
      const btn = $("#handDestroyCountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制销毁条数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">销毁条数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制服务就绪状态纯词 + round 层含 56 */
  async function paintHealthOkPlainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#healthOkPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "healthOkPlainCopyCard";
      card.className = "card health-ok-plain-copy-card";
      const sv = $("#serverVersionPlainCopyCard");
      const brandEn = $("#brandEnPlainCopyCard");
      const domain = $("#domainPlainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (sv && sv.parentNode)
        sv.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (domain && domain.parentNode)
        domain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const status = h.ok === true ? "就绪" : "未就绪";
      card.innerHTML = `<h3>服务就绪</h3>
        <p class="muted">一键复制就绪状态纯词（演示级）。</p>
        <p class="health-ok-plain-copy-preview">${esc(status)}</p>
        <button type="button" class="btn ghost sm" id="healthOkPlainCopyBtn">复制就绪状态</button>`;
      const btn = $("#healthOkPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制就绪状态" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList56() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 56;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 56); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round56 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomain().catch(() => {}), 390);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionPlainCopyButtons().catch(() => {}),
      300
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetTagPlainCopyButtons().catch(() => {}), 300);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinDueSoonCopy().catch(() => {}), 290);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelRefundNoteCopy().catch(() => {}), 310);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusKeyCopyButtons().catch(() => {}),
      300
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptKey0Copy().catch(() => {}), 270);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleZhCopyButtons().catch(() => {}), 300);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverDestroyCountNumCopy().catch(() => {}), 310);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomain().catch(() => {}), 390);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionPlainCopyButtons().catch(() => {}),
        320
      );
    if (id === "assets")
      setTimeout(() => ensureAssetTagPlainCopyButtons().catch(() => {}), 310);
    if (id === "checkin")
      setTimeout(() => ensureCheckinDueSoonCopy().catch(() => {}), 310);
    if (id === "travel")
      setTimeout(() => ensureTravelRefundNoteCopy().catch(() => {}), 330);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusKeyCopyButtons().catch(() => {}),
        320
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptKey0Copy().catch(() => {}), 290);
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleZhCopyButtons().catch(() => {}), 310);
    if (id === "handover")
      setTimeout(() => ensureHandoverDestroyCountNumCopy().catch(() => {}), 320);
    if (id === "settings") {
      setTimeout(() => {
        paintHealthOkPlainCopyCard().catch(() => {});
        paintRoundLayerList56();
      }, 360);
      setTimeout(() => {
        paintHealthOkPlainCopyCard().catch(() => {});
        paintRoundLayerList56();
      }, 900);
    }
  };

  setTimeout(() => paintHomeDomain().catch(() => {}), 450);
  setTimeout(() => ensureLegacyActionPlainCopyButtons().catch(() => {}), 470);
  setTimeout(() => ensureAssetTagPlainCopyButtons().catch(() => {}), 490);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDueSoonCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelRefundNoteCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusKeyCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptKey0Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleZhCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDestroyCountNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintHealthOkPlainCopyCard().catch(() => {});
      paintRoundLayerList56();
    }, 380);
  }
})();
