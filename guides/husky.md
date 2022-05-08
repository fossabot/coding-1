# Using Husky

### Why we use Husky at _OneZero_

First of all, here at OneZero we're a big fan of huskies but besides that it also happens to be the name of a great NPM package that helps us setup the correct git hooks in each of our repositories.

### How to install husky in a repository

Generally Husky should be installed in all of our repositories. It's used to run any tool or test we do before commiting, to make sure there are no incorrect commits being made.

```bash title="Husky installation instructions"
# Install the package itself as a dev dependency
npm install --save-dev husky
# Make sure husky installs the git hooks when you run `npm install`
npm set-script prepare "husky install"
# Setup husky itself (.husky folder with it's contents)
npm run prepare
```

### What do we use Husky for

1. Checking the commit message is correct before commiting
2. Linting and formatting the code before we commit it
3. Testing code before it's commited
