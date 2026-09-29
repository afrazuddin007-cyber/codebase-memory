import os
from dotenv import load_dotenv
from hindsight_client import Hindsight

# Load environment variables
load_dotenv()

# Connect to Hindsight
client = Hindsight(
    base_url=os.environ["HINDSIGHT_BASE_URL"],
    api_key=os.environ["HINDSIGHT_API_KEY"]
)

# Our memory bank
BANK_ID = "codebase-memory"

print("🔎 Searching Codebase Memory...\n")

# Ask Hindsight to recall relevant memories
result = client.recall(
    bank_id=BANK_ID,
    query=(
        "What is the engineering team's decision about "
        "database instantiation in the payment service?"
    )
)

print("🧠 Hindsight recalled:")

# Display the memories
for memory in result.results:
    print("\n--- Memory ---")
    print(memory.text)

# Close connection
client.close()