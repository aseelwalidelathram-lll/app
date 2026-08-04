Covers that ship with the app.

Drop an image here and point a hobby's `coverUrl` at `/covers/<file>`. Unlike a
picture added inside the app — which lives in this device's IndexedDB — a cover
here is part of the build, so it survives a reinstall and appears on every
device the app is opened on.

Keep them under ~400KB. They are displayed at roughly 700px wide at most.
