from sqlmodel import Session, select

from app.models import User

CAR = {"make": "Honda", "model": "Civic", "year": 2020, "price": 18000, "stock": 3, "category": "Sedan"}

def search(client, headers, **params):
    response = client.get("/api/vehicles/search", headers=headers, params=params)
    assert response.status_code == 200, response.text
    return sorted(vehicle["id"] for vehicle in response.json())


def seed(client, headers):
    a = create(client, headers)
    b = create(client, headers, make="Ford", model="Mustang", category="Coupe", price=35000)
    c = create(client, headers, make="Honda", model="CR-V", category="SUV", price=28000)
    return a["id"], b["id"], c["id"]
def create(client, headers, **overrides):
    r = client.post("/api/vehicles", json={**CAR, **overrides}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def listing(client, headers, **params):
    r = client.get("/api/vehicles", headers=headers, params=params)
    assert r.status_code == 200, r.text
    return r.json()


def test_register_cannot_choose_role(client, engine):
    r = client.post(
        "/api/auth/register",
        json={"email": "x@example.com", "password": "correct-horse-battery", "role": "admin"},
    )
    assert r.status_code == 201
    with Session(engine) as session:
        assert session.exec(select(User)).one().role == "user"


def test_vehicle_endpoints_require_auth(client):
    assert client.post("/api/vehicles", json=CAR).status_code == 401
    assert client.get("/api/vehicles").status_code == 401


def test_create_and_list_vehicle(client, user_headers):
    created = create(client, user_headers)
    assert created["make"] == "Honda" and created["stock"] == 3 and "id" in created
    assert [v["id"] for v in listing(client, user_headers)] == [created["id"]]


def test_search_vehicles(client, user_headers):
    civic = create(client, user_headers)
    create(client, user_headers, make="Ford", model="Mustang")
    results = listing(client, user_headers, q="civic")  # case-insensitive, matches make or model
    assert [v["id"] for v in results] == [civic["id"]]


def test_update_vehicle(client, user_headers):
    v = create(client, user_headers)
    r = client.patch(f"/api/vehicles/{v['id']}", json={"price": 17000}, headers=user_headers)
    assert r.status_code == 200
    assert r.json()["price"] == 17000 and r.json()["make"] == "Honda"


def test_delete_is_admin_only(client, user_headers, admin_headers):
    v = create(client, user_headers)
    assert client.delete(f"/api/vehicles/{v['id']}", headers=user_headers).status_code == 403
    assert len(listing(client, user_headers)) == 1
    assert client.delete(f"/api/vehicles/{v['id']}", headers=admin_headers).status_code == 204
    assert listing(client, user_headers) == []


def test_restock_is_admin_only(client, user_headers, admin_headers):
    v = create(client, user_headers)
    url = f"/api/vehicles/{v['id']}/restock"
    assert client.post(url, json={"quantity": 5}, headers=user_headers).status_code == 403
    r = client.post(url, json={"quantity": 5}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["stock"] == 8


def test_purchase_down_to_zero_then_rejected(client, user_headers):
    v = create(client, user_headers, stock=3)
    url = f"/api/vehicles/{v['id']}/purchase"
    r = client.post(url, json={"quantity": 3}, headers=user_headers)
    assert r.status_code == 200 and r.json()["stock"] == 0
    assert client.post(url, json={"quantity": 1}, headers=user_headers).status_code == 409
    assert listing(client, user_headers)[0]["stock"] == 0  # never negative


def test_purchase_more_than_stock_changes_nothing(client, user_headers):
    v = create(client, user_headers, stock=3)
    url = f"/api/vehicles/{v['id']}/purchase"
    assert client.post(url, json={"quantity": 4}, headers=user_headers).status_code == 409
    assert listing(client, user_headers)[0]["stock"] == 3
    assert client.post(url, json={"quantity": 0}, headers=user_headers).status_code == 422


def search(client, headers, **params):
    r = client.get("/api/vehicles/search", headers=headers, params=params)
    assert r.status_code == 200, r.text
    return sorted(v["id"] for v in r.json())


def seed(client, headers):
    a = create(client, headers)  # Honda Civic Sedan 18000
    b = create(client, headers, make="Ford", model="Mustang", category="Coupe", price=35000)
    c = create(client, headers, make="Honda", model="CR-V", category="SUV", price=28000)
    return a["id"], b["id"], c["id"]


def test_category_is_required_and_returned(client, user_headers):
    body = {k: v for k, v in CAR.items() if k != "category"}
    assert client.post("/api/vehicles", json=body, headers=user_headers).status_code == 422
    assert create(client, user_headers)["category"] == "Sedan"


def test_put_replaces_vehicle(client, user_headers):
    v = create(client, user_headers)
    new = {"make": "Toyota", "model": "Corolla", "year": 2022, "price": 21000, "category": "Hatchback"}
    r = client.put(f"/api/vehicles/{v['id']}", json=new, headers=user_headers)
    assert r.status_code == 200
    assert {k: r.json()[k] for k in new} == new
    assert r.json()["stock"] == 3  # PUT must not change stock


def test_put_requires_full_body(client, user_headers):
    v = create(client, user_headers)
    r = client.put(f"/api/vehicles/{v['id']}", json={"price": 1}, headers=user_headers)
    assert r.status_code == 422


def test_put_unknown_vehicle_404_and_auth_required(client, user_headers):
    new = {k: v for k, v in CAR.items() if k != "stock"}
    assert client.put("/api/vehicles/9999", json=new, headers=user_headers).status_code == 404
    assert client.put("/api/vehicles/1", json=new).status_code == 401


def test_search_requires_auth(client):
    assert client.get("/api/vehicles/search").status_code == 401


def test_search_by_make_model_category(client, user_headers):
    a, b, c = seed(client, user_headers)
    assert search(client, user_headers, make="honda") == [a, c]
    assert search(client, user_headers, model="mustang") == [b]
    assert search(client, user_headers, category="suv") == [c]


def test_search_by_price_range_inclusive(client, user_headers):
    a, b, c = seed(client, user_headers)
    assert search(client, user_headers, min_price=30000) == [b]
    assert search(client, user_headers, max_price=20000) == [a]
    assert search(client, user_headers, min_price=18000, max_price=28000) == [a, c]


def test_search_combines_filters_and_no_filters_returns_all(client, user_headers):
    a, b, c = seed(client, user_headers)
    assert search(client, user_headers, make="honda", max_price=20000) == [a]
    assert search(client, user_headers) == [a, b, c]