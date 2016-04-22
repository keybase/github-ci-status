## github-ci-status

github-ci-status will tell you whether the currently checked out state of a
Git repository was tested by a CI on GitHub, using the GitHub Statuses API.

The output can look like this:
```
λ ci
Checking keybase/client:5ab4553d88

✔ The Travis CI build passed
✔ AppVeyor build succeeded
✔ Your tests passed on CircleCI!
✔ CI tests passed

λ echo $?
0
```
Or this:
```
λ ci
Checking keybase/client:1280c0238c

✔ Your tests passed on CircleCI!
✖ AppVeyor build failed
✖ The Travis CI build failed
✖ CI tests failed

λ echo $?
2
```
Or this:
```
λ ci
Checking keybase/client:1207f99be4

✔ Your tests passed on CircleCI!
✔ The Travis CI build passed
⚠ The required number of tests weren't run (2 vs 3)

λ echo $?
4
```
