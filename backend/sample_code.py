def process_payment(request):
    db = Database()
    payment = db.get_payment(request.id)
    return payment