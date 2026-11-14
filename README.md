# Sports Motion Analysis (SpAn)
SpAn is a strategic initiative aimed at expanding global accessibility for sports coaching by leveraging advanced trained models. 

## Website
https://thespanners.github.io/SpAn/#about

## Key features
* Film user's shooting form
* Match user with a sample basketball player
* Add training sessions to improve posture & accuracy

## Objective
1. Optimise athlete performance through personalized feedback (based on their attributes and physical abilities)
2. Analyse one's body movements (in sports) using a trained model, outputting suggestions for improvement
3. Keep all relevant software free and accessible for all

## Affiliations
CS Society (led by Seoha David Kim)\
PE Society (led by Jianyuan Max Ma)

## Accounts and storage
There is no server or database yet. The Join page checks the email against profiles saved in the visitor's own browser (`localStorage`, see `js/storage.js`):
* a known email logs in, a new email continues to the stats step and creates a profile
* profiles stay saved between visits on the same browser, but are not shared between devices, and there is no password
* to make accounts real and shared, replace the functions in `js/storage.js` with calls to a backend (for example Supabase or Firebase). Nothing else in the site reads user data directly.

