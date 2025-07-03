# CarCost

## TODO:
- Force Odometer to be higher than last receipt
- OCR
- LLM
- Allow receipt images to be uploaded and saved
- Exact Fuel Type (E10 vs 98 vs 91 etc.)
- Localisation (volumes, distance, currency & language)
- Customizable dashboard
- Vendor
- Optional Odometer
- electric Charges
- Dockerize entire app

## Start up Frontend

- `npm install`
- `npm run dev`

## Start up Backend

- `python3 -m venv venv`
- `source venv/bin/activate`
- (Windows Powershell) `venv\Scripts\Activate.ps1`
- `pip install -r requirements.txt`

- `python manage.py runserver`

- `python manage.py migrate`
- `pip freeze > requirements.txt`
