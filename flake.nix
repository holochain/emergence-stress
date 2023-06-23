{
  description = "Description for the project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        # To import a flake module
        # 1. Add foo to inputs
        # 2. Add foo as a parameter to the outputs function
        # 3. Add here: foo.flakeModule
      ];

      systems = [
	# systems for which you want to build the `perSystem` attributes
	"x86_64-linux"
	"aarch64-linux"
	"x86_64-darwin"
	"aarch64-darwin"
      ];

      perSystem = { config, self', inputs', pkgs, system, ... }: {
        # Per-system attributes can be defined here. The self' and inputs'
        # module parameters provide easy access to attributes of the same
        # system.

	devShells.default = pkgs.mkShell {
	  packages = [
	    pkgs.nodejs_20
	  ];


      shellHook = ''
        export PUPPETEER_EXECUTABLE="${pkgs.chromium}/bin/chromium"
        npm i
      '';

	};
      };

      flake = {
        # The usual flake attributes can be defined here, including system-
        # agnostic ones like nixosModule and system-enumerating ones, although
        # those are more easily expressed in perSystem.
      };
    };
}
