document.addEventListener("DOMContentLoaded", function () {

  // ================= NAVBAR SCROLL =================
  window.addEventListener("scroll", function () {
    const navbar = document.getElementById("navbar");
    if (navbar) {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }
  });

  // ================= FADE-IN =================
  const faders = document.querySelectorAll(".fade-in");

  window.addEventListener("scroll", () => {
    faders.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight - 100) {
        el.classList.add("show");
      }
    });
  });

  // ================= CONTACT FORM =================
  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      if (!name || !email || !message) {
        alert("Please fill all fields");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, message })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Message sent successfully!");
          contactForm.reset();
        } else {
          alert(data.error);
        }

      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

  // ================= NEWSLETTER =================
  const newsletterForm = document.querySelector(".newsletter-form");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = newsletterForm.querySelector("input").value.trim();

      if (!email) {
        alert("Enter email");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Subscribed successfully!");
          newsletterForm.reset();
        } else {
          alert(data.error);
        }

      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

  // ================= LOAD ARTICLES =================
  async function loadArticles() {
    const container = document.getElementById("articles-container");
    if (!container) return;

    try {
      const res = await fetch("http://localhost:5000/articles");
      const articles = await res.json();

      container.innerHTML = articles.map(article => `
        <div class="article-card">
          <h3>${article.title}</h3>
          ${article.image ? `<img src="${article.image}" alt="article image">` : ""}
          <p>${article.content}</p>
        </div>
      `).join("");

    } catch (err) {
      console.error("Error loading articles", err);
    }
  }

  loadArticles();

});