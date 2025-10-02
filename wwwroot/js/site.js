$(function () {
    const CSE_API_KEY = "AIzaSyCfraIkfjAR_RtSPou4fFXlJ01vlJXQVbY";
    const CSE_ID = "65c28b73271c847d6";

    const $body = $("body");
    const $query = $("#query");
    const $results = $("#searchResults, #seachResults").first();
    const $time = $("#time");
    const $engineName = $("#engineName");
    const $searchBtn = $("#searchBtn");
    const $timeBtn = $("#timeBtn");
    const $luckyBtn = $("#luckyBtn");

    if ($.fn.button) {
        $searchBtn.button();
        $timeBtn.button();
        $luckyBtn.button?.();
    }
    if ($.fn.tooltip) {
        $(document).tooltip({ track: true });
    }
    if ($.fn.dialog) {
        $time.dialog({
            autoOpen: false,
            modal: false,
            width: 360,
            closeOnEscape: true
        });
    }

    function showTimeDialog() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        $time.text(`${hh}:${mm}`);
        if ($.fn.dialog) $time.dialog("open");
    }
    $timeBtn.on("click", showTimeDialog);

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[c]);
    }

    function renderResults(data) {
        const items = Array.isArray(data?.items) ? data.items : [];
        if (!items.length) {
            $results.html("<p>No results found</p>");
            return;
        }
        const html = items.map(it => {
            const title = escapeHtml(it.title || "");
            const link = it.link || "#";
            const displayLink = escapeHtml(it.displayLink || link.replace(/^https?:\/\//, ""));
            const snippet = escapeHtml(it.snippet || "");
            const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(it.displayLink || link)}&sz=32`;
            return `
        <article class="result" style="text-align:left; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.12);">
          <div style="font-size:.85rem; opacity:.8; display:flex; align-items:center; gap:8px;">
            <img src="${favicon}" alt="" width="16" height="16" style="vertical-align:middle;">
            <span>${displayLink}</span>
          </div>
          <h3 style="margin:.2rem 0 .15rem; line-height:1.25;">
            <a href="${link}" target="_blank" rel="noopener" style="color:#b7d3df; text-decoration:none;">
              ${title}
            </a>
          </h3>
          <p style="margin:.2rem 0; color:#dbeaf1; opacity:.95;">${snippet}</p>
        </article>
      `;
        }).join("");
        $results.html(html);
    }

    async function search(q) {
        const $results = $("#searchResults, #seachResults").first();
        if (!q) return;

        const url = new URL("https://customsearch.googleapis.com/customsearch/v1");
        url.searchParams.set("key", CSE_API_KEY);
        url.searchParams.set("cx", CSE_ID);
        url.searchParams.set("q", q);
        url.searchParams.set("num", "10");

        try {
            $results.html(`Searching for <strong>${q.replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[s]))}</strong>…`);
            const res = await fetch(url.toString(), { method: "GET" });
            const text = await res.text();
            let data; try { data = JSON.parse(text); } catch { }

            if (!res.ok) {
                const msg = data?.error?.message || text || res.statusText;
                $results.html(`<p>Search failed (${res.status}). ${msg}</p>`);
                return;
            }
            renderResults(data);
        } catch (e) {
            $results.html(`<p>Search failed (network error).</p>`);
        }
    }

    async function lucky(q) {
        const endpoint = new URL("https://customsearch.googleapis.com/customsearch/v1");
        endpoint.searchParams.set("key", CSE_API_KEY);
        endpoint.searchParams.set("cx", CSE_ID);
        endpoint.searchParams.set("q", q);
        endpoint.searchParams.set("num", "1");
        try {
            const res = await fetch(endpoint.toString());
            const data = await res.json();
            const first = data?.items?.[0]?.link;
            if (res.ok && first) {
                window.open(first, "_blank", "noopener,noreferrer");
                $results.html(`Jumped to <a href="${first}" target="_blank" rel="noopener">${escapeHtml(first)}</a>`);
            } else {
                $results.html("<p>No lucky result.</p>");
            }
        } catch {
            $results.html("<p>Lucky failed (network error).</p>");
        }
    } 

    function submitSearch() {
        const q = ($query.val() ?? "").toString().trim();
        if (!q) {
            $results.html("Enter a query first.");
            if ($.fn.effect) $query.effect("shake", { distance: 6, times: 2 }, 220);
            $query.trigger("focus");
            return;
        }
        search(q);
    }

    function submitLucky() {
        const q = ($query.val() ?? "").toString().trim();
        if (!q) {
            $results.html("Enter a query first.");
            if ($.fn.effect) $query.effect("shake", { distance: 6, times: 2 }, 220);
            $query.trigger("focus");
            return;
        }
        lucky(q);
    }

    $searchBtn.on("click", submitSearch);
    $("#luckyBtn").on("click", submitLucky);
    $("#searchForm").on("submit", function (e) {
        e.preventDefault();
        submitSearch();
    });
    $query.on("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            submitSearch();
        }
    });

    $(document).on("keydown", function (e) {
        if (e.target === $query[0]) return;
        if (e.key === "/") {
            e.preventDefault();
            $query.trigger("focus");
        } else if (typeof e.key === "string" && e.key.toLowerCase() === "t") {
            e.preventDefault();
            showTimeDialog();
        }
    });
});
