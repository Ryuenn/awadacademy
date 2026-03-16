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
    navToggles.forEach(function(navToggle) {
      navToggle.addEventListener("click", function () {
        if (!isMobile()) return;
        var expanded = navLinks.classList.contains("is-open");
        navToggles.forEach(function(btn) {
          btn.setAttribute("aria-expanded", expanded ? "false" : "true");
        });
        navLinks.classList.toggle("is-open");
      });
    });
    window.addEventListener("resize", function () {
      if (!isMobile()) {
        navLinks.classList.remove("is-open");
        navToggles.forEach(function(btn) {
          btn.setAttribute("aria-expanded", "false");
        });
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
          if (subscriptionModal) {
            subscriptionModal.classList.add("show");
            var modalForm = subscriptionModal.querySelector(".modal-form");
            var modalSuccess = subscriptionModal.querySelector(".modal-success");
            if (modalForm) modalForm.style.display = "block";
            if (modalSuccess) modalSuccess.style.display = "none";
            var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
            if (emailInput) emailInput.classList.remove("error");
            var errorMsg = subscriptionModal.querySelector(".modal-error-message");
            if (errorMsg) errorMsg.style.display = "none";
            var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
            if (nameInput) nameInput.focus();
          }
        } else {
          openVideoModal(url);
        }
      });

      trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isGalleryVideo(trigger)) {
            if (subscriptionModal) {
              subscriptionModal.classList.add("show");
              var modalForm = subscriptionModal.querySelector(".modal-form");
              var modalSuccess = subscriptionModal.querySelector(".modal-success");
              if (modalForm) modalForm.style.display = "block";
              if (modalSuccess) modalSuccess.style.display = "none";
              var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
              if (nameInput) nameInput.focus();
            }
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
  if (watchMoreVideosBtn && subscriptionModal) {
    watchMoreVideosBtn.addEventListener("click", function () {
      subscriptionModal.classList.add("show");
      var modalForm = subscriptionModal.querySelector(".modal-form");
      var modalSuccess = subscriptionModal.querySelector(".modal-success");
      if (modalForm) modalForm.style.display = "block";
      if (modalSuccess) modalSuccess.style.display = "none";
      var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
      if (emailInput) emailInput.classList.remove("error");
      var errorMsg = subscriptionModal.querySelector(".modal-error-message");
      if (errorMsg) errorMsg.style.display = "none";
      var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
      if (nameInput) nameInput.focus();
    });
  }

  // Free Resources nav link opens subscription modal
  var freeResourcesNavLink = document.getElementById("freeResourcesNavLink");
  if (freeResourcesNavLink && subscriptionModal) {
    freeResourcesNavLink.addEventListener("click", function (e) {
      e.preventDefault();
      subscriptionModal.classList.add("show");
      var modalForm = subscriptionModal.querySelector(".modal-form");
      var modalSuccess = subscriptionModal.querySelector(".modal-success");
      if (modalForm) modalForm.style.display = "block";
      if (modalSuccess) modalSuccess.style.display = "none";
      var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
      if (emailInput) emailInput.classList.remove("error");
      var errorMsg = subscriptionModal.querySelector(".modal-error-message");
      if (errorMsg) errorMsg.style.display = "none";
      var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
      if (nameInput) nameInput.focus();
    });
  }

  // Learning Center nav link opens subscription modal on non-learning-center pages
  var learningCenterNavLink = document.getElementById("learningCenterNavLink");
  if (learningCenterNavLink && subscriptionModal) {
    // Only prevent default and show modal if not on learning-center.html
    var isLearningCenterPage = window.location.pathname.includes("learning-center.html");
    if (!isLearningCenterPage) {
      learningCenterNavLink.addEventListener("click", function (e) {
        e.preventDefault();
        subscriptionModal.classList.add("show");
        var modalForm = subscriptionModal.querySelector(".modal-form");
        var modalSuccess = subscriptionModal.querySelector(".modal-success");
        if (modalForm) modalForm.style.display = "block";
        if (modalSuccess) modalSuccess.style.display = "none";
        var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
        if (emailInput) emailInput.classList.remove("error");
        var errorMsg = subscriptionModal.querySelector(".modal-error-message");
        if (errorMsg) errorMsg.style.display = "none";
        var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
        if (nameInput) nameInput.focus();
      });
    }
  }

  // Hero button opens subscription modal
  var heroCtaButton = document.getElementById("heroCtaButton");
  if (heroCtaButton && subscriptionModal) {
    heroCtaButton.addEventListener("click", function () {
      subscriptionModal.classList.add("show");
      var modalForm = subscriptionModal.querySelector(".modal-form");
      var modalSuccess = subscriptionModal.querySelector(".modal-success");
      if (modalForm) modalForm.style.display = "block";
      if (modalSuccess) modalSuccess.style.display = "none";
      var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
      if (emailInput) emailInput.classList.remove("error");
      var errorMsg = subscriptionModal.querySelector(".modal-error-message");
      if (errorMsg) errorMsg.style.display = "none";
      var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
      if (nameInput) nameInput.focus();
    });
  }

  // Program overview section buttons open subscription modal
  var programJoinBtn = document.getElementById("programJoinTrainingBtn");
  var programWatchBtn = document.getElementById("programWatchVideosBtn");
  if (programJoinBtn && subscriptionModal) {
    programJoinBtn.addEventListener("click", function () {
      subscriptionModal.classList.add("show");
      var modalForm = subscriptionModal.querySelector(".modal-form");
      var modalSuccess = subscriptionModal.querySelector(".modal-success");
      if (modalForm) modalForm.style.display = "block";
      if (modalSuccess) modalSuccess.style.display = "none";
      var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
      if (emailInput) emailInput.classList.remove("error");
      var errorMsg = subscriptionModal.querySelector(".modal-error-message");
      if (errorMsg) errorMsg.style.display = "none";
      var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
      if (nameInput) nameInput.focus();
    });
  }
  if (programWatchBtn && subscriptionModal) {
    programWatchBtn.addEventListener("click", function () {
      subscriptionModal.classList.add("show");
      var modalForm = subscriptionModal.querySelector(".modal-form");
      var modalSuccess = subscriptionModal.querySelector(".modal-success");
      if (modalForm) modalForm.style.display = "block";
      if (modalSuccess) modalSuccess.style.display = "none";
      var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
      if (emailInput) emailInput.classList.remove("error");
      var errorMsg = subscriptionModal.querySelector(".modal-error-message");
      if (errorMsg) errorMsg.style.display = "none";
      var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
      if (nameInput) nameInput.focus();
    });
  }

  // Free Resources navbar trigger - open subscription modal
  var freeResourcesLink = document.getElementById("videoGalleryNavLink");
  if (freeResourcesLink) {
    freeResourcesLink.addEventListener("click", function (e) {
      e.preventDefault();
      
      var subscriptionModal = document.querySelector(".subscription-modal");
      if (subscriptionModal) {
        subscriptionModal.classList.add("show");
        
        var modalForm = subscriptionModal.querySelector(".modal-form");
        var modalSuccess = subscriptionModal.querySelector(".modal-success");
        var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
        var emailInput = subscriptionModal.querySelector(".modal-input[type='email']");
        var errorMsg = subscriptionModal.querySelector(".modal-error-message");
        
        if (modalForm) {
          modalForm.style.display = "block";
          modalForm.reset();
        }
        if (modalSuccess) modalSuccess.style.display = "none";
        if (emailInput) emailInput.classList.remove("error");
        if (errorMsg) errorMsg.style.display = "none";
        if (nameInput) nameInput.focus();
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

    // Open modal for "Access Free Resources" button
    resourcesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      subscriptionModal.classList.add("show");
      if (modalForm) modalForm.style.display = "block";
      if (modalSuccess) modalSuccess.style.display = "none";
      clearEmailError();
      var nameInput = subscriptionModal.querySelector(".modal-input[type='text']");
      if (nameInput) nameInput.focus();
    });

    // Close modal functions
    var closeModal = function() {
      subscriptionModal.classList.remove("show");
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

        // Show loading state
        if (submitBtn) {
          submitBtn.classList.add("loading");
          submitBtn.disabled = true;
          submitBtn.textContent = "Unlocking access...";
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
          if (modalSuccess) {
            modalSuccess.style.display = "block";
            var successText = modalSuccess.querySelector("p");
            if (successText) {
              successText.textContent = "Thank you! Check your email for access details.";
            }
          }
          
          // Save subscription state
          localStorage.setItem("awadSubscribed", "true");
          
          // Redirect after brief delay
          setTimeout(function() {
            window.location.href = "videogallery.html";
          }, 2000);
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

    // Redirect button click (fallback if user manually clicks)
    if (redirectBtn) {
      redirectBtn.addEventListener("click", function () {
        window.location.href = "videogallery.html";
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
});
