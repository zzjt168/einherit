/* 电子继承 · 第二十三批增量（叠在 round22…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const PRIVACY_KEY = "einherit_privacy_mode";
  const FAV_KEY = "einherit_med_favs";
  let _acBudgetSort = ""; // "" | "high" | "low"
  let _hospitalsCache = null;

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round23SoftBanner_" + (hostId || "home");
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

  function privacyOn() {
    return localStorage.getItem(PRIVACY_KEY) === "1";
  }

  function maskPhone(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    if (!privacyOn()) return s;
    const digits = s.replace(/\D/g, "");
    if (digits.length >= 7) {
      return digits.slice(0, 3) + "****" + digits.slice(-4);
    }
    if (s.includes("@")) {
      const [name, domain] = s.split("@");
      return (name ? name[0] + "***" : "***") + "@" + (domain || "");
    }
    if (s.length <= 2) return "*".repeat(s.length);
    return s[0] + "*".repeat(Math.max(1, s.length - 2)) + s.slice(-1);
  }

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function relativeAgo(ts) {
    const t = Number(ts) || 0;
    if (!t) return "";
    const sec = Math.max(0, Date.now() / 1000 - t);
    if (sec < 60) return "约不到一分钟前";
    if (sec < 3600) return "约 " + Math.max(1, Math.floor(sec / 60)) + " 分钟前";
    if (sec < 86400) return "约 " + Math.max(1, Math.floor(sec / 3600)) + " 小时前";
    const days = Math.floor(sec / 86400);
    if (days < 30) return "约 " + days + " 天前";
    return "约 " + Math.floor(days / 30) + " 个月前";
  }

  function getFavs() {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(Number).filter((n) => n > 0) : [];
    } catch (_) {
      return [];
    }
  }

  function currentMedCountryFilter() {
    const active = $("#medRegionChips .chip.active");
    const region = (active && active.dataset.region) || "";
    const country = (($("#medCountry") && $("#medCountry").value) || "").trim();
    return { region, country };
  }

  function hospitalMatchesFilter(h, filter) {
    if (!h) return false;
    const c = String(h.country || "").trim();
    if (filter.country) return c === filter.country;
    if (filter.region === "国内") return c === "中国";
    if (filter.region === "国外") return c && c !== "中国";
    return true;
  }

  /* 1 · 首页差旅与会员双状态一行 */
  async function paintHomeMemberTravelDual() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMemberTravelDual");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMemberTravelDual";
      bar.className = "home-member-travel-dual";
      bar.setAttribute("role", "status");
      const auth = $("#homeAuthGateBar");
      const icu = $("#homeIcuReadyBar");
      const r20 = $("#homeRound20Ready");
      const progress = $("#homeLegacyProgress");
      const hint = $("#homeHint");
      if (auth && auth.parentNode === home) auth.insertAdjacentElement("afterend", bar);
      else if (icu && icu.parentNode === home) icu.insertAdjacentElement("afterend", bar);
      else if (r20 && r20.parentNode === home) r20.insertAdjacentElement("afterend", bar);
      else if (progress && progress.parentNode === home)
        progress.insertAdjacentElement("afterend", bar);
      else if (hint && hint.parentNode === home) hint.insertAdjacentElement("afterend", bar);
      else home.appendChild(bar);
    }
    try {
      const [gentle, tf] = await Promise.all([
        api("/api/membership/gentle"),
        api("/api/travel-fund"),
      ]);
      const fund = tf.fund || tf;
      const isMember = !!(gentle.is_member || gentle.member);
      const bal = Number(fund.balance || 0);
      const thr = Number(fund.threshold || 2000);
      const met = !!(fund.meets_threshold || fund.met || bal >= thr);
      const memberLabel = isMember
        ? "会员有效" +
          (gentle.member_until_iso ? "至 " + gentle.member_until_iso : "")
        : "会员未开通";
      const travelLabel = met
        ? "差旅已达门槛"
        : "差旅预存 ¥" + bal.toFixed(0) + " / ¥" + thr.toFixed(0);
      bar.hidden = false;
      bar.innerHTML = `<span class="home-dual-mark">${esc(memberLabel)}</span>
        <span class="muted home-dual-sep">·</span>
        <span class="home-dual-mark">${esc(travelLabel)}</span>
        <span class="home-dual-actions">
          <button type="button" class="btn ghost sm" id="homeDualMember">去会员</button>
          <button type="button" class="btn ghost sm" id="homeDualTravel">去差旅</button>
        </span>`;
      const mBtn = $("#homeDualMember");
      const tBtn = $("#homeDualTravel");
      if (mBtn) {
        mBtn.onclick = () => {
          if (typeof show === "function") show("member");
        };
      }
      if (tBtn) {
        tBtn.onclick = () => {
          if (typeof show === "function") show("travel");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割搜索清空按钮 */
  function ensureLegacySearchClear() {
    const box = $("#lgSearchBox");
    const input = $("#lgSearchQ");
    if (!box || !input) return;
    let btn = $("#lgSearchClear");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "lgSearchClear";
      btn.className = "btn ghost sm lg-search-clear";
      btn.textContent = "清空";
      const field = input.closest("label") || input.parentNode;
      if (field) {
        const row = document.createElement("div");
        row.className = "row lg-search-clear-row";
        row.style.cssText = "gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px";
        row.appendChild(btn);
        field.insertAdjacentElement("afterend", row);
      } else {
        box.appendChild(btn);
      }
      btn.onclick = () => {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        softBanner("搜索已清空", "legacy");
        toast("已清空关键词");
      };
    }
    const has = !!(input.value || "").trim();
    btn.hidden = !has;
  }

  function bindLegacySearchClear() {
    const input = $("#lgSearchQ");
    if (!input || input.dataset.r23clear) return;
    input.dataset.r23clear = "1";
    input.addEventListener("input", ensureLegacySearchClear);
    ensureLegacySearchClear();
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => {
      bindLegacySearchClear();
      ensureLegacySearchClear();
    }, 40);
  };

  /* 3 · 备忘复习日期一键设今日 */
  function ensureAssetReviewTodayOnForm() {
    const note = $("#asNote");
    const card = note && note.closest(".card");
    if (!card || $("#asReviewAt")) return;
    const wrap = document.createElement("div");
    wrap.className = "as-review-form-row";
    wrap.innerHTML = `<label class="field">下次检视日（可选）
        <input type="date" id="asReviewAt" />
      </label>
      <button type="button" class="btn ghost sm" id="asReviewTodayForm">今天</button>`;
    const addBtn = $("#asAdd");
    if (addBtn) addBtn.insertAdjacentElement("beforebegin", wrap);
    else card.appendChild(wrap);
    const todayBtn = $("#asReviewTodayForm");
    if (todayBtn) {
      todayBtn.onclick = () => {
        const inp = $("#asReviewAt");
        if (inp) {
          inp.value = todayIso();
          softBanner("已填入今天的检视日", "assets");
        }
      };
    }
  }

  function enhanceAssetReviewTodayButtons() {
    ensureAssetReviewTodayOnForm();
    $$("#asList .as-review").forEach((inp) => {
      const field = inp.closest("label") || inp.parentNode;
      if (!field || field.querySelector(".as-review-today")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-review-today";
      btn.textContent = "今天";
      btn.onclick = async (e) => {
        e.preventDefault();
        inp.value = todayIso();
        try {
          await api("/api/assets/review-at", {
            method: "POST",
            body: JSON.stringify({ id: Number(inp.dataset.id), review_at: inp.value }),
          });
          toast("已设为今天");
          softBanner("检视日已设为今天", "assets");
          if (typeof refreshAssets === "function") refreshAssets();
        } catch (err) {
          toast(err.message || "未完成");
        }
      };
      field.appendChild(btn);
    });
  }

  // Capture review_at before asAdd clears the form; apply on next refreshAssets
  let _pendingReviewAt = "";
  function bindAssetAddReviewCapture() {
    const btn = $("#asAdd");
    if (!btn || btn.dataset.r23cap) return;
    btn.dataset.r23cap = "1";
    btn.addEventListener(
      "click",
      () => {
        ensureAssetReviewTodayOnForm();
        _pendingReviewAt = (($("#asReviewAt") && $("#asReviewAt").value) || "").trim();
      },
      true
    );
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    enhanceAssetReviewTodayButtons();
    if (_pendingReviewAt) {
      const val = _pendingReviewAt;
      _pendingReviewAt = "";
      try {
        const { items } = await api("/api/assets");
        const newest = (items || [])[0];
        if (newest && newest.id) {
          const cur = String(newest.review_at || "").slice(0, 10);
          if (cur !== val) {
            await api("/api/assets/review-at", {
              method: "POST",
              body: JSON.stringify({ id: Number(newest.id), review_at: val }),
            });
            if ($("#asReviewAt")) $("#asReviewAt").value = "";
            await _refreshAssets();
            enhanceAssetReviewTodayButtons();
          } else if ($("#asReviewAt")) {
            $("#asReviewAt").value = "";
          }
        }
      } catch (_) {}
    }
  };

  /* 4 · 报备页上次成功时间相对化 */
  async function paintCheckinLastAgo() {
    const box = $("#checkinBox");
    if (!box) return;
    let line = $("#checkinLastAgo");
    try {
      const data = await api("/api/checkin/readable");
      if (!line) {
        line = document.createElement("p");
        line.id = "checkinLastAgo";
        line.className = "muted checkin-last-ago";
        line.setAttribute("role", "status");
        const readable = $("#checkinReadableCard");
        const peer = $("#checkinMemberPeer");
        if (readable) readable.insertAdjacentElement("beforebegin", line);
        else if (peer) peer.insertAdjacentElement("afterend", line);
        else {
          const first = box.querySelector(".card, .status-card");
          if (first) first.insertAdjacentElement("beforebegin", line);
          else box.insertBefore(line, box.firstChild);
        }
      }
      const last = Number(data.last_checkin_at || 0);
      if (!last) {
        line.textContent =
          data.last_ago_label ||
          "完成一次报备后，这里会显示上次成功的相对时间";
        return;
      }
      const ago = data.last_ago_label || relativeAgo(last);
      const abs = data.last_checkin_label || "";
      line.textContent = "上次成功报备 " + ago + (abs ? "（" + abs + "）" : "") + " · 只读";
    } catch (_) {
      if (line) line.textContent = "";
    }
  }

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    await paintCheckinLastAgo();
  };

  /* 5 · 善后工单按预算高低排序 */
  function ensureAftercareBudgetSort() {
    let bar = $("#acSortBar");
    if (!bar) {
      const list = $("#acList");
      if (!list || !list.parentNode) return null;
      bar = document.createElement("div");
      bar.id = "acSortBar";
      bar.className = "chip-row ac-sort-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "工单排序");
      bar.innerHTML = `<button type="button" class="chip active" data-acsort="new">新在上</button>
        <button type="button" class="chip" data-acsort="old">旧在上</button>`;
      list.parentNode.insertBefore(bar, list);
    }
    if (!$("#acBudgetSortHigh")) {
      const high = document.createElement("button");
      high.type = "button";
      high.className = "chip";
      high.id = "acBudgetSortHigh";
      high.dataset.acsort = "budget_high";
      high.textContent = "预算高→低";
      const low = document.createElement("button");
      low.type = "button";
      low.className = "chip";
      low.id = "acBudgetSortLow";
      low.dataset.acsort = "budget_low";
      low.textContent = "预算低→高";
      bar.appendChild(high);
      bar.appendChild(low);
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-acsort]");
        if (!btn) return;
        const key = btn.dataset.acsort || "";
        if (key === "budget_high" || key === "budget_low") {
          _acBudgetSort = key === "budget_high" ? "high" : "low";
          $$("#acSortBar .chip").forEach((c) =>
            c.classList.toggle("active", c.dataset.acsort === key)
          );
          applyAftercareBudgetSort();
        } else {
          _acBudgetSort = "";
        }
      });
    }
    $$("#acSortBar .chip").forEach((c) => {
      const key = c.dataset.acsort || "";
      if (_acBudgetSort === "high") c.classList.toggle("active", key === "budget_high");
      else if (_acBudgetSort === "low") c.classList.toggle("active", key === "budget_low");
    });
    return bar;
  }

  function applyAftercareBudgetSort(items) {
    ensureAftercareBudgetSort();
    if (!_acBudgetSort) return;
    const list = $("#acList");
    if (!list) return;
    const nodes = Array.from(list.querySelectorAll(".item"));
    if (!nodes.length) return;
    const byId = {};
    (items || []).forEach((it) => {
      byId[String(it.id)] = it;
    });
    nodes.forEach((el, i) => {
      if (!el.dataset.id && items && items[i]) el.dataset.id = String(items[i].id);
      const it = byId[el.dataset.id];
      if (it && it.travel_budget != null) {
        el.dataset.budget = String(Number(it.travel_budget) || 0);
      } else if (!el.dataset.budget) {
        const m = (el.textContent || "").match(/差旅预算\s*¥?\s*([\d.]+)/);
        el.dataset.budget = m ? String(Number(m[1]) || 0) : "0";
      }
    });
    const sorted = nodes.slice().sort((a, b) => {
      const ba = Number(a.dataset.budget || 0);
      const bb = Number(b.dataset.budget || 0);
      return _acBudgetSort === "high" ? bb - ba : ba - bb;
    });
    sorted.forEach((n) => list.appendChild(n));
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    ensureAftercareBudgetSort();
    try {
      const data = await api("/api/aftercare");
      const items = data.items || [];
      $$("#acList .item").forEach((el, i) => {
        const it = items[i];
        if (it) {
          if (it.id != null) el.dataset.id = String(it.id);
          el.dataset.budget = String(Number(it.travel_budget) || 0);
        }
      });
      applyAftercareBudgetSort(items);
    } catch (_) {
      applyAftercareBudgetSort();
    }
  };

  /* 6 · 授权视频历史条数提示 */
  function paintAuthHistCountHint(st) {
    const list = $("#avList");
    if (!list) return;
    const items = (st && st.items) || [];
    const activeId = st && st.current_active_id;
    let histN = 0;
    if (items.length) {
      histN = items.filter((it) => {
        if (it.current_active) return false;
        if (activeId && Number(it.id) === Number(activeId)) return false;
        return true;
      }).length;
      if (!histN && items.length > 1) histN = items.length - 1;
    } else {
      const nodes = $$("#avList .item");
      histN = Math.max(0, nodes.length - 1);
    }
    let hint = $("#avHistCountHint");
    const more = $("#avHistMore");
    if (histN <= 0) {
      if (hint) hint.hidden = true;
      return;
    }
    if (!hint) {
      hint = document.createElement("span");
      hint.id = "avHistCountHint";
      hint.className = "muted av-hist-count-hint";
      if (more && more.parentNode) {
        more.insertAdjacentElement("beforebegin", hint);
      } else {
        list.insertAdjacentElement("afterend", hint);
      }
    }
    hint.hidden = false;
    hint.textContent = "另有 " + histN + " 条历史";
    if (more && hint.nextSibling !== more && more.parentNode) {
      more.parentNode.insertBefore(hint, more);
    }
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      paintAuthHistCountHint(st);
    } catch (_) {
      paintAuthHistCountHint(null);
    }
  };

  /* 7 · 受益人电话脱敏与隐私开关同步 */
  function paintBenePrivacyContacts(items) {
    const listHost = $("#heirsBox .list");
    if (!listHost) return;
    const rows = $$("#heirsBox .list .item");
    (items || []).forEach((b, i) => {
      const el = rows[i];
      if (!el) return;
      const contact = String(b.contact || "").trim();
      if (!contact) return;
      let phoneEl = el.querySelector("[data-privacy-raw], .bene-contact-mask");
      if (!phoneEl) {
        // Prefer first muted line that contains contact text
        const muted = el.querySelector(".muted");
        if (muted && (muted.textContent || "").includes(contact)) {
          phoneEl = muted;
        }
      }
      if (!phoneEl) return;
      phoneEl.classList.add("bene-contact-mask");
      phoneEl.setAttribute("data-privacy-raw", contact);
      // Rebuild muted text with masked contact when privacy on
      const relation = String(b.relation || "").trim();
      const note = String(b.note || "").trim();
      const shown = privacyOn() ? maskPhone(contact) : contact;
      const parts = [];
      if (relation) parts.push(relation);
      parts.push(shown);
      if (note) parts.push(note);
      phoneEl.textContent = parts.join(" · ");
    });
  }

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    try {
      const { items } = await api("/api/beneficiaries");
      paintBenePrivacyContacts(items || []);
    } catch (_) {}
  };

  function bindPrivacyToggleSync() {
    const tog = $("#privacyModeToggle");
    if (!tog || tog.dataset.r23sync) return;
    tog.dataset.r23sync = "1";
    tog.addEventListener("change", () => {
      setTimeout(() => {
        if (typeof refreshHeirs === "function") refreshHeirs();
      }, 30);
    });
  }

  /* 8 · 手册打印缺口全部就绪绿勾 */
  async function paintPrintAllReady() {
    const card = $("#handPrintChecklist");
    if (!card) return;
    let badge = $("#handPrintAllReady");
    try {
      const data = await api("/api/handover/print-checklist");
      const items = data.items || [];
      const ready =
        data.all_ready === true ||
        (Number(data.ready_count || 0) > 0 &&
          Number(data.ready_count) === Number(data.total || items.length)) ||
        (items.length > 0 && items.every((it) => it.ok));
      if (!ready) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("div");
        badge.id = "handPrintAllReady";
        badge.className = "hand-print-all-ready";
        badge.setAttribute("role", "status");
        card.appendChild(badge);
      }
      badge.innerHTML = `<span class="hand-print-ready-mark" aria-hidden="true">✓</span>
        <span>缺口已齐 · 可导出</span>`;
      // Remove gap chips when all ready
      const gaps = $("#handPrintGapChips");
      if (gaps) gaps.remove();
    } catch (_) {}
  }

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await paintPrintAllReady();
  };

  /* 9 · 医旅国家筛选与收藏联动 */
  async function ensureHospitalsCache() {
    if (_hospitalsCache) return _hospitalsCache;
    try {
      const { items } = await api("/api/hospitals");
      _hospitalsCache = items || [];
    } catch (_) {
      _hospitalsCache = [];
    }
    return _hospitalsCache;
  }

  async function filterMedFavsByCountry() {
    const filter = currentMedCountryFilter();
    const hospitals = await ensureHospitalsCache();
    const map = {};
    hospitals.forEach((h) => {
      map[Number(h.id)] = h;
    });
    const favs = getFavs();
    const matched = favs
      .map((id) => map[id])
      .filter((h) => hospitalMatchesFilter(h, filter));
    const matchedIds = new Set(matched.map((h) => Number(h.id)));

    $$("#medFavEntryBody .item[data-hid], #medFavListCard .item[data-hid]").forEach(
      (el) => {
        const id = Number(el.dataset.hid);
        el.hidden = !matchedIds.has(id);
      }
    );

    // Update fav entry subtitle
    const entry = $("#medFavEntry");
    if (entry) {
      let sub = entry.querySelector(".med-fav-filter-hint");
      if (!sub) {
        sub = document.createElement("p");
        sub.className = "muted med-fav-filter-hint";
        const head = entry.querySelector("h3");
        if (head) head.insertAdjacentElement("afterend", sub);
        else entry.insertBefore(sub, entry.firstChild);
      }
      const label = filter.country
        ? filter.country
        : filter.region
          ? filter.region
          : "全部";
      sub.textContent =
        "当前筛选「" +
        label +
        "」下收藏 " +
        matched.length +
        " / " +
        favs.length +
        " 家";
    }

    // Empty hint inside open body
    const body = $("#medFavEntryBody");
    if (body && !body.hidden) {
      let empty = $("#medFavFilterEmpty");
      const visible = $$("#medFavEntryBody .item[data-hid]").filter((el) => !el.hidden);
      if (favs.length && !visible.length) {
        if (!empty) {
          empty = document.createElement("p");
          empty.id = "medFavFilterEmpty";
          empty.className = "muted";
          body.appendChild(empty);
        }
        empty.hidden = false;
        empty.textContent = "当前国家筛选下没有收藏，可换全部或换一个国家看看。";
      } else if (empty) {
        empty.hidden = true;
      }
    }
  }

  function bindMedCountryFavFilter() {
    const sel = $("#medCountry");
    if (sel && !sel.dataset.r23fav) {
      sel.dataset.r23fav = "1";
      sel.addEventListener("change", () => {
        filterMedFavsByCountry().catch(() => {});
      });
    }
    const chips = $("#medRegionChips");
    if (chips && !chips.dataset.r23fav) {
      chips.dataset.r23fav = "1";
      chips.addEventListener("click", () => {
        setTimeout(() => filterMedFavsByCountry().catch(() => {}), 80);
      });
    }
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q, country, region) {
    _hospitalsCache = null;
    await _refreshMed(q, country, region);
    bindMedCountryFavFilter();
    await filterMedFavsByCountry();
  };

  /* 10 · 设置·一键打开正式站健康检查 */
  function ensureHealthCheckCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsHealthCheckCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsHealthCheckCard";
      card.className = "card settings-health-check-card";
      const prod = $("#settingsProdHostCard");
      const privacy = $("#privacyModeCard");
      if (prod && prod.parentNode) prod.insertAdjacentElement("afterend", card);
      else if (privacy && privacy.parentNode)
        privacy.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    card.innerHTML = `<h3>正式站健康检查</h3>
      <p class="muted">只读查看 /api/health 摘要，不改任何状态。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button type="button" class="btn ghost sm" id="settingsHealthOpen">打开健康检查</button>
        <button type="button" class="btn ghost sm" id="settingsHealthLayer">本页摘要</button>
      </div>
      <pre id="settingsHealthSummary" class="settings-health-summary" hidden></pre>`;
    const openBtn = $("#settingsHealthOpen");
    const layerBtn = $("#settingsHealthLayer");
    if (openBtn) {
      openBtn.onclick = () => {
        const base =
          typeof API_BASE !== "undefined" ? String(API_BASE).replace(/\/$/, "") : "";
        const url = (base || "") + "/api/health";
        window.open(url, "_blank", "noopener,noreferrer");
        softBanner("已新开健康检查页", "settings");
      };
    }
    if (layerBtn) {
      layerBtn.onclick = async () => {
        const pre = $("#settingsHealthSummary");
        if (!pre) return;
        try {
          const h = await api("/api/health");
          const summary = {
            ok: h.ok,
            domain: h.domain,
            service: h.service || h.name || "E-Inherit",
            brand: h.brand || "电子继承 App",
          };
          // Keep a few more calm keys if present
          ["version", "ts", "time", "env", "status"].forEach((k) => {
            if (h[k] != null) summary[k] = h[k];
          });
          pre.hidden = false;
          pre.textContent = JSON.stringify(summary, null, 2);
          softBanner(
            h.ok ? "服务正常 · " + (h.domain || "einherit.cn") : "健康检查已返回",
            "settings"
          );
        } catch (e) {
          pre.hidden = false;
          pre.textContent = JSON.stringify({ ok: false, error: String(e.message || e) }, null, 2);
          toast(e.message || "健康检查暂不可用");
        }
      };
    }
  }

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeMemberTravelDual().catch(() => {}), 0);
    if (id === "legacy")
      setTimeout(() => {
        bindLegacySearchClear();
        ensureLegacySearchClear();
      }, 60);
    if (id === "assets")
      setTimeout(() => {
        ensureAssetReviewTodayOnForm();
        enhanceAssetReviewTodayButtons();
        bindAssetAddReviewCapture();
      }, 60);
    if (id === "checkin") setTimeout(() => paintCheckinLastAgo().catch(() => {}), 60);
    if (id === "aftercare")
      setTimeout(() => {
        ensureAftercareBudgetSort();
        applyAftercareBudgetSort();
      }, 60);
    if (id === "authvideo")
      setTimeout(() => {
        api("/api/auth-video")
          .then((st) => paintAuthHistCountHint(st))
          .catch(() => paintAuthHistCountHint(null));
      }, 80);
    if (id === "heirs")
      setTimeout(() => {
        api("/api/beneficiaries")
          .then(({ items }) => paintBenePrivacyContacts(items || []))
          .catch(() => {});
      }, 80);
    if (id === "handover") setTimeout(() => paintPrintAllReady().catch(() => {}), 80);
    if (id === "med")
      setTimeout(() => {
        bindMedCountryFavFilter();
        filterMedFavsByCountry().catch(() => {});
      }, 100);
    if (id === "settings") {
      setTimeout(() => {
        ensureHealthCheckCard();
        bindPrivacyToggleSync();
      }, 80);
      setTimeout(() => {
        ensureHealthCheckCard();
        bindPrivacyToggleSync();
      }, 350);
    }
  };

  // Boot
  paintHomeMemberTravelDual().catch(() => {});
  ensureAssetReviewTodayOnForm();
  bindAssetAddReviewCapture();
  bindLegacySearchClear();
  ensureAftercareBudgetSort();
  bindMedCountryFavFilter();
  bindPrivacyToggleSync();
  if ($("#settings") && $("#settings").classList.contains("active")) {
    ensureHealthCheckCard();
  }
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    paintCheckinLastAgo().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    paintPrintAllReady().catch(() => {});
  }
})();
