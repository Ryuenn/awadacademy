document.addEventListener("DOMContentLoaded", function () {
  var navToggle = document.querySelector(".nav-toggle-button");
  var navLinks = document.getElementById("main-nav-links");
  var footerYear = document.getElementById("footer-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear().toString();
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      navLinks.classList.toggle("is-open");
    });
  }

  // FAQS: accordion + live search
  var faqSearch = document.getElementById("faqSearch");
  var faqAccordion = document.getElementById("faqAccordion");
  var faqResults = document.getElementById("faqResults");

  if (faqAccordion) {
    var faqItems = Array.prototype.slice.call(
      faqAccordion.querySelectorAll(".faq-item")
    );

    function closeItem(item) {
      var trigger = item.querySelector(".faq-trigger");
      var panel = item.querySelector(".faq-panel");
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-expanded", "false");
      item.classList.remove("is-open");
      panel.style.maxHeight = "0px";
      panel.style.opacity = "0";
    }

    function openItem(item) {
      var trigger = item.querySelector(".faq-trigger");
      var panel = item.querySelector(".faq-panel");
      if (!trigger || !panel) return;
      trigger.setAttribute("aria-expanded", "true");
      item.classList.add("is-open");
      panel.style.maxHeight = panel.scrollHeight + "px";
      panel.style.opacity = "1";
    }

    function toggleItem(item) {
      if (item.classList.contains("is-open")) {
        closeItem(item);
      } else {
        // single-open behavior (premium docs feel)
        faqItems.forEach(function (it) {
          if (it !== item) closeItem(it);
        });
        openItem(item);
      }
    }

    // Init closed
    faqItems.forEach(function (item, idx) {
      var trigger = item.querySelector(".faq-trigger");
      var panel = item.querySelector(".faq-panel");
      if (trigger) {
        var panelId = "faq-panel-" + idx;
        trigger.setAttribute("aria-controls", panelId);
        if (panel) panel.id = panelId;
        trigger.addEventListener("click", function () {
          toggleItem(item);
        });
      }
      if (panel) {
        panel.style.maxHeight = "0px";
        panel.style.opacity = "0";
      }
    });

    function applyFilter(query) {
      var q = (query || "").trim().toLowerCase();
      var visibleCount = 0;

      faqItems.forEach(function (item) {
        var question =
          (item.getAttribute("data-question") || item.textContent || "").toLowerCase();
        var matches = q === "" || question.indexOf(q) !== -1;
        item.style.display = matches ? "" : "none";
        if (!matches) closeItem(item);
        if (matches) visibleCount += 1;
      });

      if (faqResults) {
        faqResults.textContent =
          q === ""
            ? ""
            : visibleCount === 1
              ? "1 result"
              : visibleCount + " results";
      }
    }

    if (faqSearch) {
      faqSearch.addEventListener("input", function (e) {
        applyFilter(e.target.value);
      });
    }

    // Keep panels sized correctly when resizing
    window.addEventListener("resize", function () {
      faqItems.forEach(function (item) {
        if (!item.classList.contains("is-open")) return;
        var panel = item.querySelector(".faq-panel");
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
      });
    });
  }
});

