import sqlite3

def get_user(user_id):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)

    user = cursor.fetchone()

    conn.close()
    return user


def update_email(user_id, email):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET email = ? WHERE id = ?",
        (email, user_id)
    )

    conn.commit()


def get_user_name(user_id):
    user = get_user(user_id)
    return user[1]