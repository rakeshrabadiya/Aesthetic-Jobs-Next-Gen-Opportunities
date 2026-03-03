import sqlite3
import os
from flask import Flask, jsonify, render_template, request, g
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# path to sqlite database file
DATABASE = os.path.join(os.path.dirname(__file__), "data.db")


def get_db():
    """Get a database connection, stored in flask.g so it is reused per request."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext

def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def init_db():
    """Create necessary tables if they don't already exist."""
    with app.app_context():
        db = get_db()
        cur = db.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER,
                name TEXT,
                email TEXT,
                portfolio TEXT,
                cover_letter TEXT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS job_postings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                company TEXT,
                location TEXT,
                salary TEXT,
                tags TEXT,
                description TEXT,
                requirements TEXT,
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        db.commit()

# initialise when the module is imported
init_db()

# Extended Mock Job Data with more details
JOBS = [
    {
        "id": 1,
        "title": "Senior Frontend Engineer",
        "company": "Nexus Corp",
        "location": "Remote",
        "salary": "$130k - $160k",
        "tags": ["React", "TypeScript", "UI/UX"],
        "description": "We are looking for an experienced Frontend Engineer to lead the development of our next-gen aesthetic web platforms. You will work closely with design teams to implement pixel-perfect, highly animated user interfaces.",
        "requirements": ["5+ years React/Next.js", "Strong grasp of CSS animations and motion", "Experience with WebGL is a plus"]
    },
    {
        "id": 2,
        "title": "Backend Systems Architect",
        "company": "Aether Data",
        "location": "New York, NY",
        "salary": "$150k - $180k",
        "tags": ["Python", "Golang", "Distributed Systems"],
        "description": "Aether Data is seeking a Backend Architect to design scalable distributed systems that handle millions of requests per second with ultra-low latency.",
        "requirements": ["8+ years backend engineering", "Deep knowledge of microservices and Kubernetes", "Expertise in Python or Go"]
    },
    {
        "id": 3,
        "title": "UI/UX Designer",
        "company": "Zenith Studios",
        "location": "San Francisco, CA",
        "salary": "$110k - $140k",
        "tags": ["Figma", "Interaction Design", "Prototyping"],
        "description": "Join Zenith Studios to craft beautiful, intuitive, and mesmerizing digital experiences. We focus heavily on micro-interactions and dark-mode aesthetic mastery.",
        "requirements": ["Portfolio demonstrating strong dark aesthetic", "Expertise in Figma constraints and variables", "Understanding of frontend feasibility"]
    },
    {
        "id": 4,
        "title": "Full Stack Developer",
        "company": "Quantum Innovations",
        "location": "London, UK",
        "salary": "£80k - £110k",
        "tags": ["Vue.js", "Node.js", "PostgreSQL"],
        "description": "Build end-to-end features for our quantum computing visualization platform. You will handle everything from database schema design to frontend state management.",
        "requirements": ["Proficiency in Vue 3", "Strong Node.js/Express skills", "Database optimization experience"]
    },
    {
        "id": 5,
        "title": "Machine Learning Engineer",
        "company": "Synapse AI",
        "location": "Toronto, CA",
        "salary": "$140k - $170k",
        "tags": ["PyTorch", "TensorFlow", "NLP"],
        "description": "Help us build the next generation of Large Language Models. You will be responsible for training, fine-tuning, and deploying models to production.",
        "requirements": ["Ph.D. or MS in Computer Science/AI", "Experience with Transformer architectures", "Strong Python and C++"]
    },
    {
        "id": 6,
        "title": "DevOps Engineer",
        "company": "CloudScape",
        "location": "Remote",
        "salary": "$120k - $150k",
        "tags": ["AWS", "Terraform", "CI/CD"],
        "description": "Ensure our infrastructure is robust, scalable, and secure. You'll automate our deployment pipelines and manage our multi-region AWS environments.",
        "requirements": ["AWS Certified Solutions Architect", "Strong Terraform knowledge", "Experience with GitHub Actions"]
    },
    {
        "id": 7,
        "title": "Product Manager",
        "company": "Visionary Labs",
        "location": "Austin, TX",
        "salary": "$135k - $165k",
        "tags": ["Agile", "Strategy", "User Research"],
        "description": "Drive the vision and roadmap for our flagship SaaS product. Bridge the gap between engineering, design, and our enterprise clients.",
        "requirements": ["4+ years Product Management", "Experience in B2B SaaS", "Data-driven decision making"]
    },
    {
        "id": 8,
        "title": "Animatior & Motion Designer",
        "company": "Fluid Dynamics",
        "location": "Berlin, DE",
        "salary": "€70k - €95k",
        "tags": ["After Effects", "Lottie", "CSS"],
        "description": "Bring our applications to life. We need someone obsessed with easing curves, timing, and making digital interfaces feel organic and alive.",
        "requirements": ["Mastery of After Effects", "Experience converting animations to code (Lottie/Rive)", "An obsessive eye for detail"]
    }
]


# --- Page Routes ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/companies")
def companies():
    return render_template("companies.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/post-job")
def post_job():
    return render_template("post_job.html")

# --- API Routes ---

@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    # static seeds + any jobs stored in the database
    db = get_db()
    cur = db.execute(
        "SELECT id,title,company,location,salary,tags,description,requirements FROM job_postings ORDER BY posted_at DESC"
    )
    rows = cur.fetchall()
    db_jobs = []
    for r in rows:
        db_jobs.append({
            "id": r["id"],
            "title": r["title"],
            "company": r["company"],
            "location": r["location"],
            "salary": r["salary"],
            "tags": r["tags"].split(",") if r["tags"] else [],
            "description": r["description"],
            "requirements": r["requirements"].split("\n") if r["requirements"] else []
        })

    all_jobs = JOBS + db_jobs
    return jsonify(all_jobs)

@app.route("/api/apply", methods=["POST"])
def apply_for_job():
    data = request.json
    if not data or not data.get("name") or not data.get("email"):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    job_id = data.get("job_id")
    name = data.get("name")
    email = data.get("email")
    portfolio = data.get("portfolio", "")
    cover_letter = data.get("cover_letter", "")

    db = get_db()
    db.execute(
        "INSERT INTO applications (job_id,name,email,portfolio,cover_letter) VALUES (?,?,?,?,?)",
        (job_id, name, email, portfolio, cover_letter)
    )
    db.commit()

    print(f"[*] New Application Saved: {name} applied for Job ID {job_id}")

    return jsonify({"status": "success", "message": "Application submitted successfully!"})


@app.route("/api/applications", methods=["GET"])
def list_applications():
    """Return all applications stored in the database.  For development only."""
    db = get_db()
    rows = db.execute("SELECT * FROM applications ORDER BY submitted_at DESC").fetchall()
    results = [dict(r) for r in rows]
    return jsonify(results)


@app.route("/api/login", methods=["POST"])
def mock_login():
    data = request.json
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"status": "error", "message": "Email and password required"}), 400

    email = data.get("email").lower()
    password = data.get("password")

    db = get_db()
    cur = db.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    if row:
        # verify password (in a real app use proper hashing/salting)
        if not check_password_hash(row["password"], password):
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401
        user = {"name": row["name"], "email": row["email"]}
    else:
        # register new user automatically
        name = email.split("@")[0].capitalize()
        hashed = generate_password_hash(password)
        db.execute(
            "INSERT INTO users (email, password, name) VALUES (?,?,?)",
            (email, hashed, name)
        )
        db.commit()
        user = {"name": name, "email": email}

    import time
    time.sleep(1)  # artificial aesthetic delay
    print(f"[*] User logged in/registered with email: {email}")

    return jsonify({
        "status": "success",
        "message": "Logged in successfully!",
        "user": user
    })

@app.route("/api/post-job", methods=["POST"])
def create_job():
    data = request.form
    if not data or not data.get("title") or not data.get("company"):
         return jsonify({"status": "error", "message": "Missing required fields"}), 400

    title = data.get("title")
    company = data.get("company")
    location = data.get("location", "Remote")
    salary = data.get("salary", "Competitive")
    tags = ",".join([t.strip() for t in data.get("tags", "").split(",") if t.strip()])
    description = data.get("description", "")
    requirements = "\n".join([r.strip() for r in data.get("requirements", "").split("\n") if r.strip()])

    db = get_db()
    db.execute(
        "INSERT INTO job_postings (title,company,location,salary,tags,description,requirements) VALUES (?,?,?,?,?,?,?)",
        (title, company, location, salary, tags, description, requirements)
    )
    db.commit()

    print(f"[*] New Job Posted: {title} at {company}")
    return jsonify({"status": "success", "message": "Job posted successfully!"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)

