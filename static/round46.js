/* 电子继承 · 第四十六批增量（叠在 round45…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round46SoftBanner_" + (hostId || "home");
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

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();
    if (r === "heir") return "继承人";
    if (r === "family") return "家人";
    if (r === "executor") return "执行人";
    return String(role || "");
  }

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1" || v === "true";
  }

  /* 1 · 首页善后工单总条数一句 */
  async function paintHomeAftercareCount() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAftercareCountBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAftercareCountBar";
      bar.className = "home-aftercare-count-bar";
      bar.setAttribute("role", "status");
      const company = $("#homeCompanyFilledBar");
      const cover = $("#homeHandoverActionCoverBar");
      const counts = $("#homeCountsSummaryBar");
      if (company && company.parentNode === home)
        company.insertAdjacentElement("afterend", bar);
      else if (cover && cover.parentNode === home)
        cover.insertAdjacentElement("afterend", bar);
      else if (counts && counts.parentNode === home)
        counts.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/counts-summary").catch(() => ({}));
      const counts = data.counts || {};
      let n = Number(counts.aftercare != null ? counts.aftercare : NaN);
      if (Number.isNaN(n) && Array.isArray(data.cards)) {
        const card = data.cards.find(
          (c) => c.key === "aftercare" || c.label === "工单"
        );
        n = card ? Number(card.count || 0) : 0;
      }
      if (Number.isNaN(n)) n = 0;
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-aftercare-count-mark">善后工单</span>
          <span class="muted home-aftercare-count-sub">可先开一单 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeAftercareCountGo">去善后</button>`;
      } else {
        bar.innerHTML = `<span class="home-aftercare-count-mark">善后工单</span>
          <span class="muted home-aftercare-count-sub">共 ${n} 单 · 可随时回看</span>
          <button type="button" class="btn ghost sm" id="homeAftercareCountGo">去善后</button>`;
      }
      const btn = $("#homeAftercareCountGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("aftercare");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割清除照片状态一键复制 */
  async function ensureLegacyClearPhotosCopyButtons() {
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
      const line = truthyFlag(it.clear_photos)
        ? "已勾清除照片"
        : "未勾清除照片";
      el.dataset.clearPhotosLabel = line;
      if (el.querySelector(".lg-copy-clear-photos")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-clear-photos";
      btn.textContent = "复制清除照片状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.clearPhotosLabel || "");
        softBanner(ok ? "已复制清除照片状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+平台组合复制 */
  async function ensureAssetIdPlatformCopyButtons() {
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
      if (!it || it.id == null) return;
      const platform = String(it.platform || "").trim();
      const line = platform ? "#" + it.id + " · " + platform : "#" + it.id;
      el.dataset.idPlatform = line;
      if (el.querySelector(".as-copy-id-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-platform";
      btn.textContent = "复制编号与平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPlatform || "");
        softBanner(ok ? "已复制编号与平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制备用联系人首位关系 */
  async function ensureCheckinBackupRelationCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinBackupRelationCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinBackupRelationCopyCard";
      card.className = "checkin-backup-relation-copy";
      const phone = $("#checkinBackupPhoneCopyCard");
      const first = $("#checkinBackupFirstCopyCard");
      const overdue = $("#checkinOverdueCalmCopyCard");
      if (phone && phone.parentNode)
        phone.insertAdjacentElement("afterend", card);
      else if (first && first.parentNode)
        first.insertAdjacentElement("afterend", card);
      else if (overdue && overdue.parentNode)
        overdue.insertAdjacentElement("afterend", card);
      else {
        const c = box.querySelector(".card");
        if (c) c.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const backups = (st.user || {}).backup_contacts || [];
      const row = backups[0] || {};
      const relation = String(row.relation || "").trim();
      if (!relation) {
        card.innerHTML = `<p class="muted">暂无备用联系人关系 · 可先在设置里补充（演示）</p>`;
        return;
      }
      const line =
        "备用联系人首位关系 · " +
        relation +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-backup-relation-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinBackupRelationCopyBtn">复制备用首位关系</button>`;
      const btn = $("#checkinBackupRelationCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(relation);
          softBanner(ok ? "已复制备用首位关系" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">备用关系暂不可用</p>`;
    }
  }

  /* 5 · 差旅还差金额纯数字一键复制 */
  async function ensureTravelShortfallNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallNumCopyCard";
      card.className = "travel-shortfall-num-copy";
      const bal = $("#travelBalanceNumCopyCard");
      const pct = $("#travelProgressPctNumCopyCard");
      const thr = $("#travelThresholdNumCopyCard");
      if (bal && bal.parentNode) bal.insertAdjacentElement("afterend", card);
      else if (pct && pct.parentNode)
        pct.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode)
        thr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall = Number(
        fund.shortfall != null
          ? fund.shortfall
          : Math.max(
              0,
              Number(fund.threshold || 2000) - Number(fund.balance || 0)
            )
      );
      const num = String(Math.round(Math.max(0, shortfall)));
      const line = "差旅还差金额数字 · " + num;
      card.innerHTML = `<p class="muted travel-shortfall-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallNumCopyBtn">复制还差数字</button>`;
      const btn = $("#travelShortfallNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制还差数字" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">还差数字暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+状态组合复制 */
  async function ensureAftercareCityStatusCopyButtons() {
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
      const city = String(it.city || "").trim();
      const status = String(it.status_label || "").trim();
      const line =
        city && status ? city + " · " + status : city || status;
      el.dataset.cityStatus = line;
      if (!line || el.querySelector(".ac-copy-city-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-status";
      btn.textContent = "复制城市与状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityStatus || "");
        softBanner(ok ? "已复制城市与状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频条目状态一键复制 */
  async function ensureAuthStatusCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avStatusCopyCard";
      card.className = "av-status-copy";
      const thr = $("#avThresholdPassedCopyCard");
      const label = $("#avActiveLabelCopyCard");
      const orig = $("#avOriginalNameCopyCard");
      if (thr && thr.parentNode) thr.insertAdjacentElement("afterend", card);
      else if (label && label.parentNode)
        label.insertAdjacentElement("afterend", card);
      else if (orig && orig.parentNode)
        orig.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const items = data.items || [];
      const active =
        (typeof data.current_active === "object" && data.current_active) ||
        data.latest ||
        items.find((it) => it.current_active) ||
        items[0] ||
        null;
      const status = active ? String(active.status || "").trim() : "";
      if (!status) {
        card.innerHTML = `<p class="muted">暂无视频条目状态</p>`;
        return;
      }
      const line = "授权视频条目状态 · " + status;
      card.innerHTML = `<p class="muted av-status-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avStatusCopyBtn">复制条目状态</button>`;
      const btn = $("#avStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(status);
          softBanner(ok ? "已复制条目状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+角色组合复制 */
  async function ensureHeirIdRoleCopyButtons() {
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
      const role = roleLabel(it.role);
      const line = role ? "#" + it.id + " · " + role : "#" + it.id;
      el.dataset.idRole = line;
      if (el.querySelector(".bn-copy-id-role")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-role";
      btn.textContent = "复制编号与角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRole || "");
        softBanner(ok ? "已复制编号与角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册受益人人数纯数字一键复制 */
  async function ensureHandoverBeneficiaryCountNumCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBeneficiaryCountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBeneficiaryCountNumCopyCard";
      card.className = "hand-beneficiary-count-num-copy";
      const byAction = $("#handByActionCopyCard");
      const byDept = $("#handByDeptCopyCard");
      const member = $("#handMemberStatusCopyCard");
      if (byAction && byAction.parentNode)
        byAction.insertAdjacentElement("afterend", card);
      else if (byDept && byDept.parentNode)
        byDept.insertAdjacentElement("afterend", card);
      else if (member && member.parentNode)
        member.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const n = Number(
        data.beneficiary_count != null
          ? data.beneficiary_count
          : (data.heirs || []).length
      );
      const num = String(Math.max(0, Math.round(n)));
      const line = "手册受益人人数数字 · " + num;
      card.innerHTML = `<p class="muted hand-beneficiary-count-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBeneficiaryCountNumCopyBtn">复制受益人人数</button>`;
      const btn = $("#handBeneficiaryCountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制受益人人数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">受益人人数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制就绪·域名·应用版本 + round 层含 46 */
  async function paintReadyDomainVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#readyDomainVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "readyDomainVersionCopyCard";
      card.className = "card ready-domain-version-copy-card";
      const appSv = $("#appServerVersionCopyCard");
      const cnEn = $("#cnEnDomainCopyCard");
      const enDom = $("#enDomainServerCopyCard");
      const roundList = $("#roundLayerListCard");
      if (appSv && appSv.parentNode)
        appSv.insertAdjacentElement("beforebegin", card);
      else if (cnEn && cnEn.parentNode)
        cnEn.insertAdjacentElement("beforebegin", card);
      else if (enDom && enDom.parentNode)
        enDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = h.ok ? "就绪" : "未就绪";
      const domain = h.domain || "einherit.cn";
      const ver = String(h.version || "0.5.0").replace(/^v/i, "");
      const line = ready + " · " + domain + " · v" + ver;
      card.innerHTML = `<h3>就绪 · 域名 · 应用版本</h3>
        <p class="muted">一键复制服务就绪状态 + 域名 + 应用版本（演示级）。</p>
        <p class="ready-domain-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="readyDomainVersionCopyBtn">复制就绪·域名·版本</button>`;
      const btn = $("#readyDomainVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪·域名·版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 域名 · 应用版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList46() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 46;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 46); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round46 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAftercareCount().catch(() => {}), 290);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyClearPhotosCopyButtons().catch(() => {}), 200);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdPlatformCopyButtons().catch(() => {}), 200);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinBackupRelationCopy().catch(() => {}), 190);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallNumCopy().catch(() => {}), 210);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityStatusCopyButtons().catch(() => {}),
      200
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthStatusCopy().catch(() => {}), 170);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdRoleCopyButtons().catch(() => {}), 200);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBeneficiaryCountNumCopy().catch(() => {}),
      210
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAftercareCount().catch(() => {}), 290);
    if (id === "legacy")
      setTimeout(() => ensureLegacyClearPhotosCopyButtons().catch(() => {}), 220);
    if (id === "assets")
      setTimeout(() => ensureAssetIdPlatformCopyButtons().catch(() => {}), 210);
    if (id === "checkin")
      setTimeout(() => ensureCheckinBackupRelationCopy().catch(() => {}), 210);
    if (id === "travel")
      setTimeout(() => ensureTravelShortfallNumCopy().catch(() => {}), 230);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityStatusCopyButtons().catch(() => {}),
        220
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthStatusCopy().catch(() => {}), 190);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdRoleCopyButtons().catch(() => {}), 210);
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBeneficiaryCountNumCopy().catch(() => {}),
        220
      );
    if (id === "settings") {
      setTimeout(() => {
        paintReadyDomainVersionCopyCard().catch(() => {});
        paintRoundLayerList46();
      }, 260);
      setTimeout(() => {
        paintReadyDomainVersionCopyCard().catch(() => {});
        paintRoundLayerList46();
      }, 700);
    }
  };

  // Boot
  setTimeout(() => paintHomeAftercareCount().catch(() => {}), 350);
  setTimeout(() => ensureLegacyClearPhotosCopyButtons().catch(() => {}), 370);
  setTimeout(() => ensureAssetIdPlatformCopyButtons().catch(() => {}), 390);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinBackupRelationCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthStatusCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBeneficiaryCountNumCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintReadyDomainVersionCopyCard().catch(() => {});
      paintRoundLayerList46();
    }, 280);
  }
})();
