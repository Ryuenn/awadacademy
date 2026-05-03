document.addEventListener("DOMContentLoaded", function () {
  var navToggles = document.querySelectorAll(".nav-toggle-button");
  var navLinks = document.getElementById("main-nav-links");

  function isMobile() {
    return window.innerWidth < 768;
  }
  var footerYear = document.getElementById("footer-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear().toString();
  }

  if (navToggles.length && navLinks) {
    // Backdrop + header injected once (mobile drawer)
    var navBackdrop = document.querySelector(".mobile-nav-backdrop");
    if (!navBackdrop) {
      navBackdrop = document.createElement("div");
      navBackdrop.className = "mobile-nav-backdrop";
      navBackdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(navBackdrop);
    }

    function ensureMobileNavHeader() {
      if (navLinks.querySelector(".mobile-nav-header")) return;
      var header = document.createElement("div");
      header.className = "mobile-nav-header";

      var brand = document.createElement("div");
      brand.className = "mobile-nav-brand";
      var logo = document.createElement("img");
      logo.src = "assets/awadacademylogo.png";
      logo.alt = "Awad Academy";
      var title = document.createElement("div");
      title.className = "mobile-nav-title";
      title.innerHTML = "<strong>Menu</strong><span>Navigate</span>";
      brand.appendChild(logo);
      brand.appendChild(title);

      var closeBtn = document.createElement("button");
      closeBtn.className = "mobile-nav-close";
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Close menu");
      closeBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M18 6L6 18" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/>' +
        '<path d="M6 6L18 18" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"/>' +
        "</svg>";

      header.appendChild(brand);
      header.appendChild(closeBtn);
      navLinks.insertBefore(header, navLinks.firstChild);

      closeBtn.addEventListener("click", function () {
        closeMobileNav();
      });
    }

    function ensureMobileNavList() {
      if (navLinks.querySelector(".mobile-nav-list")) return;

      // Build a clean, mobile-only menu from the existing navbar markup.
      var list = document.createElement("div");
      list.className = "mobile-nav-list";

      function makeLink(label, href) {
        var a = document.createElement("a");
        a.className = "mobile-nav-link";
        a.href = href;
        a.textContent = label;
        return a;
      }

      function makeAccordion(label, items) {
        var wrap = document.createElement("div");
        wrap.className = "mobile-nav-accordion";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mobile-nav-accordion-trigger";
        btn.setAttribute("aria-expanded", "false");
        btn.innerHTML =
          "<span>" +
          label +
          "</span><span class=\"mobile-nav-accordion-caret\" aria-hidden=\"true\">▾</span>";

        var panel = document.createElement("div");
        panel.className = "mobile-nav-accordion-panel";

        items.forEach(function (it) {
          panel.appendChild(makeLink(it.label, it.href));
        });

        btn.addEventListener("click", function () {
          var isOpen = wrap.classList.contains("is-open");
          // single-open inside the drawer
          Array.prototype.slice
            .call(list.querySelectorAll(".mobile-nav-accordion"))
            .forEach(function (node) {
              if (node !== wrap) {
                node.classList.remove("is-open");
                var t = node.querySelector(".mobile-nav-accordion-trigger");
                if (t) t.setAttribute("aria-expanded", "false");
              }
            });
          wrap.classList.toggle("is-open", !isOpen);
          btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
        });

        wrap.appendChild(btn);
        wrap.appendChild(panel);
        return wrap;
      }

      // Parse existing items
      Array.prototype.slice.call(navLinks.children).forEach(function (child) {
        if (!child || child.classList && (child.classList.contains("mobile-nav-header") || child.classList.contains("mobile-nav-list"))) {
          return;
        }

        // Plain top-level links
        if (child.tagName === "A" && child.getAttribute("href")) {
          list.appendChild(makeLink(child.textContent.trim(), child.getAttribute("href")));
          return;
        }

        // Dropdowns (About / Academy)
        if (child.classList && child.classList.contains("nav-dropdown")) {
          var trigger = child.querySelector(".nav-link-has-dropdown");
          var menu = child.querySelector(".nav-dropdown-menu");
          if (!trigger || !menu) return;
          var label = trigger.textContent.replace("▾", "").trim();
          var submenuItems = [];
          Array.prototype.slice.call(menu.querySelectorAll("a[href]")).forEach(function (a) {
            submenuItems.push({ label: a.textContent.trim(), href: a.getAttribute("href") });
          });
          list.appendChild(makeAccordion(label, submenuItems));
        }
      });

      navLinks.appendChild(list);

      // Mobile submenu links are cloned without ids — mirror desktop Learning Center → modal
      list.addEventListener("click", function (e) {
        var a = e.target && e.target.closest ? e.target.closest("a") : null;
        if (!a) return;
        if (!isMobile()) return;
        var href = (a.getAttribute("href") || "").trim();
        var onLearningCenterPage = window.location.pathname.indexOf("learning-center.html") !== -1;
        if (href.indexOf("learning-center.html") !== -1 && !onLearningCenterPage) {
          e.preventDefault();
          showSubscriptionSignupModal("learning-center.html");
        }
        closeMobileNav();
      });
    }

    function setNavOpenState(isOpen) {
      navToggles.forEach(function (btn) {
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      navLinks.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
    }

    function openMobileNav() {
      if (!isMobile()) return;
      ensureMobileNavHeader();
      ensureMobileNavList();
      setNavOpenState(true);
    }

    function closeMobileNav() {
      setNavOpenState(false);
    }

    navToggles.forEach(function(navToggle) {
      navToggle.addEventListener("click", function () {
        if (!isMobile()) return;
        var expanded = navLinks.classList.contains("is-open");
        if (expanded) closeMobileNav();
        else openMobileNav();
      });
    });

    // Close on backdrop click
    navBackdrop.addEventListener("click", function () {
      closeMobileNav();
    });

    // Legacy dropdown markup is hidden on mobile; the mobile list handles its own clicks.

    // ESC closes
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) {
        closeMobileNav();
      }
    });

    window.addEventListener("resize", function () {
      if (!isMobile()) {
        closeMobileNav();
      }
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

  // Video modal: open embedded video in overlay
  var videoModal = document.getElementById("videoModal");
  var videoModalFrame = document.getElementById("videoModalFrame");
  var videoModalCloseBtn = document.getElementById("videoModalCloseBtn");
  var videoModalBackdrop = document.getElementById("closeVideoModal");
  var videoTriggers = document.querySelectorAll("[data-vimeo-url]");
  var watchMoreVideosBtn = document.getElementById("watchMoreVideosBtn");
  var subscriptionModal = document.querySelector(".subscription-modal");

  function showSubscriptionSignupModal(redirectPage, modalEl) {
    var m = modalEl || subscriptionModal;
    if (!m) return;
    var page = redirectPage || "videogallery.html";
    m.setAttribute("data-redirect-page", page);
    m.classList.remove("is-navigating");
    m.classList.add("show");
    var modalForm = m.querySelector(".modal-form");
    var modalSuccess = m.querySelector(".modal-success");
    if (modalForm) modalForm.style.display = "block";
    if (modalSuccess) modalSuccess.style.display = "none";
    var emailInput = m.querySelector(".modal-input[type='email']");
    if (emailInput) emailInput.classList.remove("error");
    var errorMsg = m.querySelector(".modal-error-message");
    if (errorMsg) errorMsg.style.display = "none";
    var nameInput = m.querySelector(".modal-input[type='text']");
    if (nameInput) nameInput.focus();
  }

  document.querySelectorAll(".subscription-modal").forEach(function (m) {
    var content = m.querySelector(".modal-content");
    if (!content || content.querySelector(".modal-nav-busy")) return;
    var busy = document.createElement("div");
    busy.className = "modal-nav-busy";
    busy.setAttribute("aria-hidden", "true");
    busy.innerHTML =
      '<div class="modal-nav-busy-inner">' +
      '<div class="modal-nav-busy-spinner" aria-hidden="true"></div>' +
      '<p class="modal-nav-busy-text">Taking you there…</p>' +
      "</div>";
    content.appendChild(busy);
  });

  function openVideoModal(url) {
    if (!videoModal || !videoModalFrame) return;
    videoModalFrame.src = url;
    videoModal.setAttribute("aria-hidden", "false");
    videoModal.classList.add("is-open");
  }

  function closeVideoModal() {
    if (!videoModal || !videoModalFrame) return;
    videoModal.setAttribute("aria-hidden", "true");
    videoModal.classList.remove("is-open");
    videoModalFrame.src = "";
  }

  // Check if a video trigger is in the gallery (requires subscription)
  function isGalleryVideo(trigger) {
    return trigger.closest(".success-video-grid") !== null;
  }

  if (videoTriggers.length && videoModal && videoModalFrame) {
    videoTriggers.forEach(function (trigger) {
      var url = trigger.getAttribute("data-vimeo-url");
      if (!url) return;

      trigger.addEventListener("click", function (e) {
        // Gallery videos require subscription modal
        if (isGalleryVideo(trigger)) {
          e.preventDefault();
          e.stopPropagation();
          showSubscriptionSignupModal("videogallery.html");
        } else {
          openVideoModal(url);
        }
      });

      trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isGalleryVideo(trigger)) {
            showSubscriptionSignupModal("videogallery.html");
          } else {
            openVideoModal(url);
          }
        }
      });
    });

    if (videoModalCloseBtn) {
      videoModalCloseBtn.addEventListener("click", closeVideoModal);
    }

    if (videoModalBackdrop) {
      videoModalBackdrop.addEventListener("click", closeVideoModal);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeVideoModal();
      }
    });
  }

  // Watch More Videos button opens subscription modal
  if (watchMoreVideosBtn) {
    watchMoreVideosBtn.addEventListener("click", function () {
      showSubscriptionSignupModal("videogallery.html");
    });
  }

  // Free Resources nav link opens subscription modal (always gallery after unlock)
  var freeResourcesNavLink = document.getElementById("freeResourcesNavLink");
  if (freeResourcesNavLink) {
    freeResourcesNavLink.addEventListener("click", function (e) {
      e.preventDefault();
      showSubscriptionSignupModal("videogallery.html");
    });
  }

  // Learning Center nav link opens subscription modal on non-learning-center pages
  var learningCenterNavLink = document.getElementById("learningCenterNavLink");
  if (learningCenterNavLink) {
    var isLearningCenterPage = window.location.pathname.includes("learning-center.html");
    if (!isLearningCenterPage) {
      learningCenterNavLink.addEventListener("click", function (e) {
        e.preventDefault();
        showSubscriptionSignupModal("learning-center.html");
      });
    }
  }

  // Hero CTA opens subscription modal (redirect to Learning Center after unlock)
  var heroCtaButton = document.getElementById("heroCtaButton");
  if (heroCtaButton) {
    heroCtaButton.addEventListener("click", function () {
      showSubscriptionSignupModal("learning-center.html");
    });
  }

  // Program overview section buttons open subscription modal
  var programJoinBtn = document.getElementById("programJoinTrainingBtn");
  var programWatchBtn = document.getElementById("programWatchVideosBtn");
  if (programJoinBtn) {
    programJoinBtn.addEventListener("click", function () {
      showSubscriptionSignupModal("videogallery.html");
    });
  }
  if (programWatchBtn) {
    programWatchBtn.addEventListener("click", function () {
      showSubscriptionSignupModal("videogallery.html");
    });
  }

  // Free Resources navbar trigger - open subscription modal
  var freeResourcesLink = document.getElementById("videoGalleryNavLink");
  if (freeResourcesLink) {
    freeResourcesLink.addEventListener("click", function (e) {
      e.preventDefault();
      var m = document.querySelector(".subscription-modal");
      if (m) {
        showSubscriptionSignupModal("videogallery.html", m);
        var modalForm = m.querySelector(".modal-form");
        if (modalForm) modalForm.reset();
      }
    });
  }

  // Subscription Modal and CTA Button Functionality
  var allCtaBanners = document.querySelectorAll(".section-cta");
  
  allCtaBanners.forEach(function(banner) {
    var subscriptionModal = banner.nextElementSibling;
    
    // Check if the following element is a subscription modal
    if (!subscriptionModal || !subscriptionModal.classList.contains("subscription-modal")) {
      return; // Skip if modal not found
    }
    
    var modalForm = subscriptionModal.querySelector(".modal-form");
    var modalSuccess = subscriptionModal.querySelector(".modal-success");
    var modalClose = subscriptionModal.querySelector(".modal-close");
    var joinBtn = banner.querySelector(".cta-banner-button-solid");
    var resourcesBtn = banner.querySelector(".cta-banner-button-outline");
    var redirectBtn = subscriptionModal.querySelector(".modal-redirect");
    var submitBtn = subscriptionModal.querySelector(".modal-cta");
    var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
    
    if (!joinBtn || !resourcesBtn) return;

    // Email validation function
    var validateEmail = function(email) {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Clear error state
    var clearEmailError = function() {
      if (emailInput) {
        emailInput.classList.remove("error");
        var errorMsg = emailInput.parentElement.querySelector(".modal-error-message");
        if (errorMsg) {
          errorMsg.style.display = "none";
        }
      }
    };

    // Show email error
    var showEmailError = function(message) {
      if (emailInput) {
        emailInput.classList.add("error");
        var errorMsg = emailInput.parentElement.querySelector(".modal-error-message");
        if (!errorMsg) {
          errorMsg = document.createElement("div");
          errorMsg.className = "modal-error-message";
          emailInput.parentElement.appendChild(errorMsg);
        }
        errorMsg.textContent = message;
        errorMsg.style.display = "block";
      }
    };

    // Open modal for "Access Free Resources" button (always post-unlock → gallery)
    resourcesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showSubscriptionSignupModal("videogallery.html", subscriptionModal);
      clearEmailError();
    });

    // Close modal functions
    var closeModal = function() {
      subscriptionModal.classList.remove("show");
      subscriptionModal.classList.remove("is-navigating");
      if (redirectBtn) {
        redirectBtn.textContent = "Continue to Videos";
      }
      if (modalForm) {
        modalForm.style.display = "block";
        modalForm.reset();
        if (submitBtn) {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
          submitBtn.textContent = "Unlock Access";
        }
      }
      if (modalSuccess) modalSuccess.style.display = "none";
      clearEmailError();
    };

    if (modalClose) {
      modalClose.addEventListener("click", closeModal);
    }

    subscriptionModal.addEventListener("click", function (e) {
      if (e.target === subscriptionModal) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && subscriptionModal.classList.contains("show")) {
        closeModal();
      }
    });

    // Clear error on input
    if (emailInput) {
      emailInput.addEventListener("input", clearEmailError);
    }

    // Form submission
    if (modalForm) {
      modalForm.addEventListener("submit", function (e) {
        e.preventDefault();
        
        // Validate email
        var emailValue = emailInput ? emailInput.value.trim() : "";
        if (emailValue && !validateEmail(emailValue)) {
          showEmailError("Please enter a valid email address");
          return;
        }

        // Get form data
        var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
        var nameValue = nameInput ? nameInput.value.trim() : "";

        var lockedRedirect = (subscriptionModal.getAttribute("data-redirect-page") || "videogallery.html").trim();
        if (!lockedRedirect) lockedRedirect = "videogallery.html";

        // Show loading state
        if (submitBtn) {
          submitBtn.classList.add("loading");
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        // Submit to Formspree using fetch with JSON
        var data = {
          name: nameValue,
          email: emailValue
        };

        fetch("https://formspree.io/f/mreykwwa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(data)
        })
        .then(function(response) {
          return response.json().then(function(json) {
            if (response.ok) {
              return json;
            } else {
              throw new Error("Form submission failed");
            }
          });
        })
        .then(function(data) {
          // Success - show modal success message
          if (modalForm) modalForm.style.display = "none";
          if (submitBtn) {
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
            submitBtn.textContent = "Unlock Access";
          }
          subscriptionModal.setAttribute("data-redirect-page", lockedRedirect);
          if (modalSuccess) {
            modalSuccess.style.display = "block";
            var successText = modalSuccess.querySelector("p");
            if (successText) {
              successText.textContent = "Thank you! Check your email for access details.";
            }
          }
          if (redirectBtn) {
            var toLearning = lockedRedirect.indexOf("learning-center") !== -1;
            redirectBtn.textContent = toLearning
              ? "Continue to Learning Center"
              : "Continue to Free Resources";
          }
          localStorage.setItem("awadSubscribed", "true");
        })
        .catch(function(error) {
          console.error("Error:", error);
          showEmailError("There was an error sending your email. Please try again.");
          if (submitBtn) {
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
            submitBtn.textContent = "Unlock Access";
          }
        });
      });
    }

    if (redirectBtn) {
      redirectBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var redirectPage = (subscriptionModal.getAttribute("data-redirect-page") || "videogallery.html").trim() || "videogallery.html";
        subscriptionModal.classList.add("is-navigating");
        setTimeout(function () {
          window.location.href = redirectPage;
        }, 420);
      });
    }

    // Join Live Event button redirect with click animation
    joinBtn.addEventListener("click", function (e) {
      e.preventDefault();
      setTimeout(function() {
        window.location.href = "contact.html";
      }, 120);
    });
  });

  document.querySelectorAll('form[action*="formspree.io"]').forEach(function (form) {
    if (form.classList.contains("modal-form")) return;
    if (form.querySelector('input[name="_next"]')) return;
    var nextInput = document.createElement("input");
    nextInput.type = "hidden";
    nextInput.name = "_next";
    nextInput.value = window.location.href.split("#")[0];
    form.insertBefore(nextInput, form.firstChild);
  });
});
