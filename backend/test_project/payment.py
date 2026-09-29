def process_payment(request):
    db = Database()
    payment = db.get_payment(request.id)

    if payment is None:
        return None

    payment.status = "complete"

    return payment