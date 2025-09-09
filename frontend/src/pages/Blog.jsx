import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import '../styles/pages/static-pages.css';

const blogArticles = [
  {
    id: 1,
    slug: 'more-dangerous-than-terrorism-pothole-crisis',
    title: 'More Dangerous Than Terrorism: The Deadly Reality of India\'s Pothole Crisis',
    date: '2025-07-18',
    readTime: '8 min read',
    excerpt: 'In 2017, potholes killed over four times more Indians than terrorism. This invisible public health emergency demands urgent action.',
    content: `India prides itself on its sprawling road network — over **6.3 million kilometers** long, second only to the United States. Our roads carry **90% of passenger traffic** and **64% of freight** — they are the arteries of our economy, our commutes, and our everyday lives.

But there's a deadly crack in this foundation: **potholes.**

You might dismiss them as mere annoyances — the occasional jolt, the spilled chai, the angry horn. But potholes have grown into something far more sinister. They are no longer a symbol of inconvenience; they are **an invisible public health emergency**. One that kills thousands — and maims even more.

---

## 🚧 A Death Toll Hidden in Plain Sight

In 2017, **3,597 people were killed** in pothole-related accidents across India.

In the same year, **803 people died** due to all acts of terrorism — including Naxal attacks.

Let that sink in.

> **A pothole was over four times more likely to kill an Indian than a terrorist.**

Yet terrorism commands headlines, policies, and budget allocations. Potholes? They are patched with loose gravel, ignored until outrage goes viral, or worse — buried in manipulated data and forgotten.

---

## 📊 What the Data Really Tells Us

Between **2013 and 2022**, India recorded:

* **Over 60,000 pothole-related crashes**
* **More than 20,000 lives lost**
* **Thousands more injured or disabled for life**

But these figures are **just the tip of the iceberg**.

A study by the Institute for Health Metrics and Evaluation estimated that India **underreports road deaths by up to 80%**. If we adjust for that, the real pothole death toll might be **closer to 100,000 people in a decade**.

Why are the numbers inaccurate? Because most accident reports:

* Blame the **driver** ("negligence"),
* Skip over road defects,
* And rarely implicate civic authorities.

This is not a statistical error — it's a **systemic deflection of responsibility.**

---

## 🛣️ India's Pothole Hotspots

The problem isn't equally distributed.

In **2022**, **Uttar Pradesh alone** accounted for **over 55%** of all pothole-related deaths in the country. A single state responsible for more than half the national death toll.

Other major danger zones:

* **Maharashtra**, especially Mumbai's crumbling monsoon-hit roads
* **Madhya Pradesh**, with surging accident numbers in recent years
* **Bengaluru**, topping the charts for civic negligence deaths

Meanwhile, some states like **Bihar** and **Gujarat** reported "zero" pothole deaths — a statistical miracle that conveniently defies both common sense and satellite imagery.

---

## 💸 The Economic Drain You Don't See

Beyond human tragedy, potholes bleed the nation dry.

* India loses **₹8 lakh crore** a year (approx. **3% of GDP**) to road accidents.
* Potholes increase **fuel consumption**, damage vehicles, and clog roads.
* They inflict a **"hidden health tax"**: back pain, anxiety, lost sleep, chronic fatigue.

In just one year, **Brihanmumbai Municipal Corporation (BMC)** spent ₹545 crore fixing potholes — and the city was still waterlogged with 26,000 of them in a 2018 survey.

---

## ⚖️ Justice Delayed, Denied

You *can* sue. Victims of pothole deaths have the right to:

* File claims under the **Motor Vehicles Act**
* Pursue **tort law** for negligence
* Appeal under **Article 21** of the Constitution (Right to Life)

But here's the truth: **Litigation is long, tedious, and costly.** Victims must:

* Document the pothole,
* Prove causality,
* Fight well-funded civic bodies in court — often for years.

Even when courts intervene — like in Mumbai and Bengaluru — officials drag their feet, reassign blame, or commission temporary "patch jobs" that worsen the road.

---

## 🧱 Why the Roads Don't Stay Fixed

Here's the hard truth: **our roads are built to fail** — because failure is profitable.

Contractors use cheap materials, deliver poor-quality work, and are rehired every monsoon to "fix" the same craters. This creates a perverse cycle:

> **"Build badly. Watch it break. Get paid to fix it."**

* Municipalities spend crores on potholes.
* Repairs are often cosmetic — loose gravel, tar sprayed over air.
* There's **no accountability**, no audits, no criminal liability — until people die.

And even then, the system rarely punishes.

---

## 🔧 What Needs to Change — Now

Potholes are **not inevitable**. They are a solvable, human-made crisis. Here's what IndianPotholes.com advocates:

### 1. **Fix Accountability, Not Just Roads**

* Jail negligent contractors under **Bharatiya Nyaya Sanhita**
* Make public liability insurance **mandatory** in every road contract
* Hold civic commissioners **personally accountable** for road deaths

### 2. **Data That Doesn't Lie**

* Fully implement and **independently audit** the new iRAD database
* Penalize false reporting — reward honest data collection

### 3. **Use Better Materials and Tech**

* Ban loose gravel "repairs"
* Adopt cold-mix, polymer-modified materials
* Use drones, AI, and predictive maintenance — not WhatsApp complaints

### 4. **Let Citizens Lead**

* Formalize **citizen road audits**
* Scale up **"road adoption"** programs with RWAs and local businesses
* Allow users to **geo-tag, rate, and track** pothole repairs publicly

---

## ✊ This Is Why IndianPotholes.com Exists

This isn't just a blog. It's a **movement**.

We're here to:

* Publish **verifiable pothole data**
* Map unsafe roads
* Pressure authorities
* Help victims seek justice
* Build a citizen-led accountability loop

Because we believe no Indian should **die on their way to work, school, or home** — because of a hole in the road.

---

### 🗺️ Let's Reclaim the Roads

We refuse to let another monsoon become another mass funeral season.

We're building a community of citizens, journalists, lawyers, engineers, and reformers — and we need you.

**Report a pothole. Upload images. Share this post. Tell your story.**

Let's make roads **safe**, not **sacred cows for corruption**.

Because the road to progress cannot be one riddled with death.`
  }
];

// Blog List Component
export function BlogList() {
  return (
    <div className="blog-container">
      <div className="blog-home">
        <div className="blog-header">
          <h1>Our Blog</h1>
          <p className="blog-subtitle">Stories, insights, and data about India's road safety crisis</p>
        </div>
        
        <div className="blog-articles">
          {blogArticles.map(article => (
            <Link key={article.id} to={`/blog/${article.slug}`} className="blog-preview-card-link">
              <article className="blog-preview-card">
                <div className="blog-preview-header">
                  <h2>{article.title}</h2>
                  <div className="blog-meta">
                    <span className="blog-date">{article.date}</span>
                    <span className="blog-read-time">{article.readTime}</span>
                  </div>
                </div>
                <p className="blog-excerpt">{article.excerpt}</p>
                <div className="read-more">Read Article →</div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Blog Post Component
export function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const article = blogArticles.find(article => article.slug === slug);
  
  if (!article) {
    return (
      <div className="blog-container">
        <div className="blog-not-found">
          <h1>Article Not Found</h1>
          <p>The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="blog-back-btn">← Back to all articles</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <article className="blog-article-full">
        <header className="blog-article-header">
          <Link to="/blog" className="blog-back-btn">
            ← Back to all articles
          </Link>
          <div className="blog-article-meta">
            <time className="blog-date">{article.date}</time>
            <span className="blog-read-time">{article.readTime}</span>
          </div>
          <h1 className="blog-article-title">{article.title}</h1>
        </header>
        
        <div className="blog-article-content">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
        
        <footer className="blog-article-footer">
          <div className="blog-cta">
            <h3>Help Us Make Roads Safer</h3>
            <p>Report potholes, share data, and join our movement for better roads.</p>
            <button className="cta-button" onClick={() => navigate('/upload')}>
              Report a Pothole
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}

// Main Blog Component (for backward compatibility)
export default function Blog() {
  return <BlogList />;
} 