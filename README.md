# version-check

This github action extracts your project from a configuration file (like package.json), and checks if a tag with the same version
doesn't already exist on the repo. If the version is unique, it exports the version number as an output variable from the action, that
can be used in a later step to publish a release.

## Supported Project Configurations:
- NodeJS (package.json) (Reads from the version key on the root of the json)
- Rust (Cargo.toml) (Reads from the `version` property in the `[package]` section)

## Use cases:
1. You want to extract your version number from a file, and construct a different tag for it based on the string. Can be used to
   for example, to publish (1.0.0-beta) for pushes on a beta branch, and (1.0.0) on a stable branch
2. You want to perform checks on PRs/pushes to verify if the version number on your project was updated, and doesn't already exist on the repo as a tag.
   This is useful as it prevents you from overwriting the same version number, which can get messy to revert


## Usage
### Pre-requisites
Create a workflow `.yml` file in your `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

**Note 1**: The current version requires you to fetch all tags on the repo when you checkout your repo. (This will be done automatically in a later update)

### Inputs

- `file`: The path to the configuration file of the project (See [Supported Project Configurations](#supported-project-configurations))
- `tagFormat`: By default just ${version}, but can be modified to transform the version to another format, for eg (${version}-beta)
- `failBuild`: If `true` the build will be failed if the version already exists in the repo. (By default this value is `true`, set to `false` if you don't want the build to fail)

### Outputs

- `releaseVersion`: The version read from the project, in the format as given in the `tagFormat` input.
- `rawVersion`: The raw version number read from the project configuration file
- `versionChanged`: `true` if the version changed, `false` otherwise
- `releaseTags`: Assumed that `rawVersion` follows semantic versioning, and outputs a string of comma seperated tags, to use for docker image versioning. (For example, the rawVersion `1.0.2` would lead to releaseTags becoming `1,1.0,1.0.2`. Note that each of the tags also folloe the tagFormat specified
  
### Example workflow - 
Read a version from your package.json, and check if a tag of the format `v${version}-beta` already exists on the repo on PRs to the `staging` branch.
If the version exists, the build fails, otherwise, the version number is exported to the `releaseVersion` variable


```yaml
on:
  pull_request:
    branches:
      - staging
name: Continuous integration
jobs:
  version-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - run: git fetch --all --tags

      - name: Check Release Version
        uses: thebongy/version-check@v2
        with:
          file: package.json
          tagFormat: v${version}-beta
        id: version_check_staging
      - name:
        run: |
        echo "Version ${{steps.version_check_staging.outputs.releaseVersion}}"
```

## Contributing
We would love you to contribute pull requests are welcome!

## License
The scripts and documentation in this project are released under the [MIT License](LICENSE)
