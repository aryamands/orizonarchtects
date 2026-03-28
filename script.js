document.addEventListener("DOMContentLoaded", () => {

  const BASE_URL = "https://orizon-backend.onrender.com";

  // ================= SAFE FETCH =================
  async function safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      let data;

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      return { ok: res.ok, data };

    } catch (err) {
      console.error("Fetch Error:", err);
      return { ok: false, data: { error: "Network error" } };
    }
  }

  // ================= NAVBAR SCROLL =================
  const navbar = document.querySelector("header");

  window.addEventListener("scroll", () => {
    if (navbar) {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }
  });

  // ================= FADE-IN ANIMATION =================
  const faders = document.querySelectorAll(".fade-in");

  function fadeIn() {
    faders.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight - 100) {
        el.classList.add("show");
      }
    });
  }

  window.addEventListener("scroll", fadeIn);
  fadeIn();

  // ================= CONTACT FORM =================
  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (!name || !email || !message) {
        alert("Please fill all fields");
        return;
      }

      const { ok, data } = await safeFetch(`${BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, message })
      });

      if (ok) {
        alert("Message sent successfully ✅");
        contactForm.reset();
      } else {
        alert(data.error || "Something went wrong ❌");
      }
    });
  }

  // ================= NEWSLETTER =================
  const newsletterForm = document.querySelector(".newsletter-form");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = newsletterForm.querySelector("input").value.trim();

      if (!email) {
        alert("Enter email");
        return;
      }

      const { ok, data } = await safeFetch(`${BASE_URL}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      if (ok) {
        alert("Subscribed successfully ✅");
        newsletterForm.reset();
      } else {
        alert(data.error || "Subscription failed ❌");
      }
    });
  }

  // ================= LOAD ARTICLES =================
  async function loadArticles() {
    const container = document.getElementById("articles-container");
    if (!container) return;

    const { ok, data } = await safeFetch(`${BASE_URL}/articles`);

    if (!ok) return;

    container.innerHTML = data.map(article => `
      <div class="article-card">
        <h3>${article.title}</h3>
        ${article.image ? `<img src="${article.image}" alt="">` : ""}
        <p>${article.content}</p>
      </div>
    `).join("");
  }

  loadArticles();

  // ================= PROJECT HOVER TILT =================
  const projectCards = document.querySelectorAll(".project-card");

  projectCards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotateX = (y / rect.height - 0.5) * 10;
      const rotateY = (x / rect.width - 0.5) * -10;

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(1.03)
      `;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "none";
    });
  });

  // ================= CONTACT INPUT MICRO UX =================
  const inputs = document.querySelectorAll(".contact-form input, .contact-form textarea");

  inputs.forEach(input => {
    input.addEventListener("focus", () => {
      input.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
      input.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", () => {
      input.style.boxShadow = "none";
      input.style.transform = "scale(1)";
    });
  });

  // ================= BUTTON CLICK FEEDBACK =================
  const buttons = document.querySelectorAll(".submit-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.style.transform = "scale(0.95)";
      setTimeout(() => {
        btn.style.transform = "scale(1)";
      }, 150);
    });
  });

}); // END DOM

// ================= GLOBAL FUNCTION =================

// DOWNLOAD DATA (NOW PUBLIC)
function downloadData(type) {
  window.open(`https://orizon-backend.onrender.com/export/${type}`, "_blank");
}