/* 电子继承 · 第十八批增量（叠在 round17…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  const DEPT_CHIPS = [
    { id: "", label: "全部" },
    { id: "production", label: "生产部" },
    { id: "finance", label: "财务部" },
    { id: "ip", label: "知识产权部" },
    { id: "admin", label: "行政部" },
    { id: "board", label: "董事会" },
  ];
  const PRINT_GAP_GO = {
    executor: "checkin",
    items: "legacy",
    beneficiaries: "heirs",
  };
  let _acSortOldest = false;
  let _avHistOpen = false;

  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round18SoftBanner_" + (hostId || "home");
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
    }, 8000);
    return el;
  }

  /* 1 · 首页下次报备温和倒计时 */
  async function paintHomeCheckinCountdown() {
    const strip = $("#todayCheckin");
    if (!strip) return;
    let line = $("#homeCheckinCountdown");
    if (!line) {
      line = document.createElement("p");
      line.id = "homeCheckinCountdown";
      line.className = "muted home-checkin-countdown";
      line.setAttribute("role", "status");
      const detail = $("#todayDetail");
      if (detail && detail.parentNode) detail.insertAdjacentElement("afterend", line);
      else strip.appendChild(line);
    }
    try {
      const data = await api("/api/checkin/readable");
      const hours = Number(data.hours_remaining || 0);
      const secs = Number(data.seconds_remaining || 0);
      if (!data.last_checkin_at) {
        line.textContent =
          data.countdown_label || "完成一次报备后，这里会显示下次温和倒计时";
        return;
      }
      if (secs <= 0 || hours <= 0) {
        line.textContent = "已到建议报备点，可按自己节奏完成";
        return;
      }
      if (hours >= 1) {
        line.textContent = "约 " + Math.max(1, Math.floor(hours)) + " 小时后再报备";
      } else {
        const mins = Math.max(1, Math.ceil(secs / 60));
        line.textContent = "约 " + mins + " 分钟后再报备";
      }
    } catch (_) {
      line.textContent = "";
    }
  }

  /* 5 · 差旅余额低于门槛首页轻条 */
  async function paintHomeTravelSoftBar() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeTravelSoftBar");
    try {
      const { fund } = await api("/api/travel-fund");
      const bal = Number(fund.balance || 0);
      const thr = Number(fund.threshold || 2000);
      const met = !!(fund.meets_threshold || fund.met || bal >= thr);
      if (met) {
        if (bar) {
          bar.hidden = true;
          bar.textContent = "";
        }
        return;
      }
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "homeTravelSoftBar";
        bar.className = "ok soft-banner soft-banner-cta home-travel-soft";
        const hint = $("#homeHint");
        if (hint && hint.parentNode === home) hint.insertAdjacentElement("afterend", bar);
        else {
          const strip = $("#todayCheckin");
          if (strip && strip.parentNode === home) strip.insertAdjacentElement("afterend", bar);
          else home.appendChild(bar);
        }
      }
      bar.innerHTML = "";
      const span = document.createElement("span");
      span.textContent = "差旅预存还可补足（演示）";
      bar.appendChild(span);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = "去差旅";
      btn.onclick = () => {
        if (typeof show === "function") show("travel");
      };
      bar.appendChild(btn);
      bar.hidden = false;
    } catch (_) {
      if (bar) bar.hidden = true;
    }
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    await paintHomeCheckinCountdown();
    await paintHomeTravelSoftBar();
  };

  /* 2 · 交割批量改接收人 */
  async function ensureBatchBeneBar() {
    const list = $("#lgList");
    if (!list || !list.parentNode) return;
    let bar = $("#lgBatchBeneBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lgBatchBeneBar";
      bar.className = "card lg-batch-bene-bar";
      bar.innerHTML = `<h3>批量指定接收人</h3>
        <p class="muted">勾选条目后，一键写上同一接收人。</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:flex-end">
          <label class="field" style="flex:1;min-width:140px">接收人
            <input id="lgBatchBene" list="lgBeneList" placeholder="从名册选择或手写"/>
          </label>
          <button class="btn" id="lgBatchBeneApply" type="button">应用到勾选</button>
        </div>`;
      const batch = $("#lgBatchBar");
      if (batch && batch.parentNode) batch.insertAdjacentElement("afterend", bar);
      else list.parentNode.insertBefore(bar, list);
      $("#lgBatchBeneApply").onclick = async () => {
        const ids = $$("#lgList .lg-check:checked").map((c) => Number(c.dataset.id));
        const name = (($("#lgBatchBene") && $("#lgBatchBene").value) || "").trim();
        if (!ids.length) {
          toast("请先勾选交割条目");
          return;
        }
        if (!name) {
          toast("请填写接收人");
          return;
        }
        try {
          await api("/api/legacy/batch-beneficiary", {
            method: "POST",
            body: JSON.stringify({ ids, beneficiary: name }),
          });
          toast("已批量指定接收人");
          if (typeof refreshLegacy === "function") refreshLegacy();
        } catch (e) {
          toast(e.message);
        }
      };
    }
  }

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    await ensureBatchBeneBar();
  };

  /* 3 · 备忘按部门 chip 计数 */
  function paintAssetDeptCounts(items) {
    const bar = $("#asDeptFilterBar");
    if (!bar) return;
    const counts = {};
    (items || []).forEach((it) => {
      const d = String(it.dept || "").trim();
      if (!d) return;
      counts[d] = (counts[d] || 0) + 1;
    });
    const total = (items || []).length;
    DEPT_CHIPS.forEach((c) => {
      const btn = bar.querySelector(`[data-asdept="${c.id}"]`);
      if (!btn) return;
      if (!c.id) {
        btn.textContent = total ? c.label + " " + total : c.label;
      } else {
        const n = counts[c.id] || 0;
        btn.textContent = n ? c.label + " " + n : c.label;
      }
    });
  }

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    try {
      const data = await api("/api/assets");
      paintAssetDeptCounts(data.items || []);
    } catch (_) {}
  };

  /* 4 · 报备打卡后回到首页 CTA */
  const _doQuick = window.doQuickCheckin;
  if (typeof _doQuick === "function") {
    window.doQuickCheckin = async function () {
      await _doQuick();
      const activeCheckin =
        ($("#checkin") && $("#checkin").classList.contains("active")) ||
        document.body.dataset.panel === "checkin";
      const hostId = activeCheckin ? "checkin" : "home";
      softBanner("报备已记下。", hostId, [
        {
          label: "回首页看今日卡",
          onClick: () => {
            if (typeof show === "function") show("home");
            setTimeout(() => {
              const strip = $("#todayCheckin");
              if (strip) strip.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 60);
          },
        },
      ]);
    };
  }

  /* 6 · 善后工单按创建时间近→远默认 */
  function ensureAftercareSortBar() {
    const list = $("#acList");
    if (!list || !list.parentNode) return null;
    let bar = $("#acSortBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "acSortBar";
      bar.className = "chip-row ac-sort-bar";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "工单排序");
      bar.innerHTML = `<button type="button" class="chip active" data-acsort="new">新在上</button>
        <button type="button" class="chip" data-acsort="old">旧在上</button>`;
      const compare = $("#acBalanceCompare");
      const gate = $("#acAuthGate");
      const anchor = compare || gate;
      if (anchor && anchor.parentNode) anchor.insertAdjacentElement("afterend", bar);
      else list.parentNode.insertBefore(bar, list);
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-acsort]");
        if (!btn) return;
        _acSortOldest = btn.dataset.acsort === "old";
        $$("#acSortBar .chip").forEach((c) =>
          c.classList.toggle("active", c.dataset.acsort === btn.dataset.acsort)
        );
        applyAftercareSort();
      });
    }
    $$("#acSortBar .chip").forEach((c) =>
      c.classList.toggle(
        "active",
        (_acSortOldest ? "old" : "new") === (c.dataset.acsort || "")
      )
    );
    return bar;
  }

  function applyAftercareSort(items) {
    ensureAftercareSortBar();
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
      if (it && it.created_at != null) el.dataset.created = String(it.created_at);
      else if (!el.dataset.created) el.dataset.created = String(el.dataset.id || i);
    });
    const sorted = nodes.slice().sort((a, b) => {
      const ca = Number(a.dataset.created || a.dataset.id || 0);
      const cb = Number(b.dataset.created || b.dataset.id || 0);
      return _acSortOldest ? ca - cb : cb - ca;
    });
    sorted.forEach((n) => list.appendChild(n));
  }

  /* 7 · 授权视频列表折叠旧记录 */
  function foldAuthVideoHistory(st) {
    const list = $("#avList");
    if (!list) return;
    const items = st && st.items ? st.items : [];
    const activeId = st && st.current_active_id;
    const nodes = $$("#avList .item");
    if (nodes.length <= 1) {
      const more = $("#avHistMore");
      if (more) more.hidden = true;
      return;
    }
    let histCount = 0;
    nodes.forEach((el, i) => {
      const name = ((el.querySelector("strong") || {}).textContent || "").trim();
      const it =
        items.find(
          (x) => String(x.original_name || x.filename || "") === name
        ) || items[i];
      const isActive =
        it &&
        (it.current_active || (activeId && Number(it.id) === Number(activeId)));
      if (isActive) {
        el.hidden = false;
        el.classList.remove("av-hist-folded");
        return;
      }
      histCount += 1;
      el.classList.add("av-hist-folded");
      el.hidden = !_avHistOpen;
    });
    let btn = $("#avHistMore");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "avHistMore";
      btn.className = "btn ghost sm av-hist-more";
      list.insertAdjacentElement("afterend", btn);
      btn.onclick = () => {
        _avHistOpen = !_avHistOpen;
        $$("#avList .item.av-hist-folded").forEach((el) => {
          el.hidden = !_avHistOpen;
        });
        btn.textContent = _avHistOpen ? "收起历史" : "查看历史";
      };
    }
    if (histCount > 0) {
      btn.hidden = false;
      btn.textContent = _avHistOpen ? "收起历史" : "查看历史";
    } else {
      btn.hidden = true;
    }
  }

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    try {
      const st = await api("/api/auth-video");
      foldAuthVideoHistory(st);
    } catch (_) {}
  };

  /* 8 · 手册打印清单缺口 chip */
  async function paintPrintGapChips() {
    const card = $("#handPrintChecklist");
    if (!card) return;
    let row = $("#handPrintGapChips");
    try {
      const data = await api("/api/handover/print-checklist");
      const gaps = (data.items || []).filter((it) => !it.ok);
      if (!gaps.length) {
        if (row) row.remove();
        return;
      }
      if (!row) {
        row = document.createElement("div");
        row.id = "handPrintGapChips";
        row.className = "chip-row hand-print-gap-chips";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", "打印前缺口");
        card.appendChild(row);
      }
      row.innerHTML = gaps
        .map((it) => {
          const go = it.go || PRINT_GAP_GO[it.key] || "";
          return `<button type="button" class="chip gap-chip print-gap-chip" data-go="${esc(
            go
          )}" data-print-gap="${esc(it.key)}">去补${esc(it.label)}</button>`;
        })
        .join("");
      row.querySelectorAll("[data-go]").forEach((btn) => {
        btn.onclick = () => {
          const go = btn.dataset.go;
          if (go && typeof show === "function") show(go);
          if (go === "checkin") {
            setTimeout(() => {
              const el = $("#executorName");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
              }
            }, 80);
          }
        };
      });
    } catch (_) {}
  }

  /* 9 · 医旅意向空态双 CTA */
  function paintMedIntentEmptyCta() {
    const box = $("#medIntents");
    if (!box) return;
    const hasItems = !!box.querySelector(".item");
    let empty = $("#medIntentEmptyCta");
    if (hasItems) {
      if (empty) empty.remove();
      return;
    }
    if (!empty) {
      empty = document.createElement("div");
      empty.id = "medIntentEmptyCta";
      empty.className = "med-intent-empty-cta";
    }
    empty.innerHTML = `<p class="muted">还没有意向单。可以先搜索医院，或看看本机收藏。</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button type="button" class="btn ghost sm" id="medEmptySearch">去搜索医院</button>
        <button type="button" class="btn ghost sm" id="medEmptyFav">看收藏</button>
      </div>`;
    // Replace plain empty muted if present
    const plain = Array.from(box.querySelectorAll("p.muted")).find((p) =>
      /还没有意向|暂无意向/.test(p.textContent || "")
    );
    if (plain) plain.replaceWith(empty);
    else if (!empty.parentNode) box.appendChild(empty);
    const searchBtn = $("#medEmptySearch");
    if (searchBtn) {
      searchBtn.onclick = () => {
        const q = $("#medQ");
        if (q) {
          q.focus();
          q.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const list = $("#medList");
        if (list) list.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
    }
    const favBtn = $("#medEmptyFav");
    if (favBtn) {
      favBtn.onclick = () => {
        const entry = $("#medFavEntry");
        if (entry) {
          entry.scrollIntoView({ behavior: "smooth", block: "center" });
          const toggle = entry.querySelector("button");
          if (toggle && /收藏/.test(toggle.textContent || "")) toggle.click();
        } else if (typeof show === "function") {
          show("med");
        }
      };
    }
  }

  const _refreshMed = window.refreshMed;
  window.refreshMed = async function (q, country, region) {
    await _refreshMed(q, country, region);
    paintMedIntentEmptyCta();
  };

  /* 10 · 设置·一键复制服务信息 */
  async function enhanceSettingsCopyService() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsCopyServiceCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsCopyServiceCard";
      card.className = "card settings-copy-service-card";
      const prod = $("#settingsProdHostCard");
      const svc = $("#settingsServiceCard");
      if (prod && prod.parentNode) prod.insertAdjacentElement("afterend", card);
      else if (svc && svc.parentNode) svc.insertAdjacentElement("afterend", card);
      else box.appendChild(card);
    }
    let version = "—";
    let domain = "einherit.cn";
    try {
      const h = await api("/api/health");
      version = h.version || version;
      domain = h.domain || domain;
    } catch (_) {}
    const blob =
      "电子继承 App · E-Inherit\nv" +
      version +
      " · " +
      domain +
      "\n唯一正式站";
    card.innerHTML = `<h3>服务信息</h3>
      <p class="muted">一键复制版本、域名与正式站说明，便于对照。</p>
      <pre class="settings-copy-preview" id="settingsCopyPreview">${esc(blob)}</pre>
      <button type="button" class="btn block" id="settingsCopyServiceBtn" style="margin-top:10px">复制服务信息</button>`;
    const btn = $("#settingsCopyServiceBtn");
    if (btn) {
      btn.onclick = async () => {
        const text = ($("#settingsCopyPreview") && $("#settingsCopyPreview").textContent) || blob;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          toast("已复制服务信息");
          softBanner("服务信息已复制到剪贴板。", "settings");
        } catch (e) {
          toast(e.message || "复制失败");
        }
      };
    }
  }

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    try {
      const data = await api("/api/aftercare");
      const items = data.items || [];
      $$("#acList .item").forEach((el, i) => {
        if (items[i] && items[i].id != null) el.dataset.id = String(items[i].id);
        if (items[i] && items[i].created_at != null)
          el.dataset.created = String(items[i].created_at);
      });
      applyAftercareSort(items);
    } catch (_) {
      applyAftercareSort([]);
    }
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    await paintPrintGapChips();
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") {
      setTimeout(() => {
        paintHomeCheckinCountdown().catch(() => {});
        paintHomeTravelSoftBar().catch(() => {});
      }, 0);
    }
    if (id === "legacy") setTimeout(() => ensureBatchBeneBar().catch(() => {}), 40);
    if (id === "assets") {
      setTimeout(() => {
        api("/api/assets")
          .then((d) => paintAssetDeptCounts(d.items || []))
          .catch(() => {});
      }, 40);
    }
    if (id === "aftercare") setTimeout(() => applyAftercareSort([]), 40);
    if (id === "authvideo") {
      setTimeout(() => {
        api("/api/auth-video")
          .then((st) => foldAuthVideoHistory(st))
          .catch(() => {});
      }, 40);
    }
    if (id === "handover") setTimeout(() => paintPrintGapChips().catch(() => {}), 60);
    if (id === "med") setTimeout(paintMedIntentEmptyCta, 40);
    if (id === "settings") setTimeout(() => enhanceSettingsCopyService().catch(() => {}), 0);
  };

  // Boot
  if ($("#home") && $("#home").classList.contains("active")) {
    paintHomeCheckinCountdown().catch(() => {});
    paintHomeTravelSoftBar().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    applyAftercareSort([]);
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    api("/api/auth-video")
      .then((st) => foldAuthVideoHistory(st))
      .catch(() => {});
  }
})();
