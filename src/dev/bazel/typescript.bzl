load("@npm//typescript:index.bzl", "tsc")

def _types_pkg_impl(ctx):
  out = ctx.actions.declare_file("package.json")
  ctx.actions.expand_template(
    output = out,
    template = ctx.file._template,
    substitutions = {"{NAME}": ctx.attr.package_name},
  )

  return [DefaultInfo(files = depset([out]))]

types_pkg = rule(
  implementation = _types_pkg_impl,
  attrs = {
    "package_name": attr.string(),
    "_template": attr.label(
      allow_single_file = True,
      default = "package_json.tpl",
    ),
  },
)


