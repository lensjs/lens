#  (2026-02-16)


### Bug Fixes

* add optional chaining to prevent runtime errors in RequestDetails component ([d29c189](https://github.com/lensjs/lens/commit/d29c189091394d4dadaf3c2fa59401cc5c375ccb))
* **adonis-adapter:** correct middleware and server provider imports ([f183c4a](https://github.com/lensjs/lens/commit/f183c4a0ff9d28b2613c32fd891f9c2b89e6ea0a))
* cache emit event ([6b8a3e6](https://github.com/lensjs/lens/commit/6b8a3e6a2682df1cb21025f5071e824c002a660c))
* default key if not cache key provided ([0f50b70](https://github.com/lensjs/lens/commit/0f50b70794c951ad81bcf4904bcb4f8f96e3565c))
* **docs:** incorrect description of isAuthenticated method ([db5f838](https://github.com/lensjs/lens/commit/db5f8383c92890baa08dd495f08881224a390d86))
* **docs:** remove line from important note ([16e9568](https://github.com/lensjs/lens/commit/16e9568f29cba3a9b1ecbf31c8451baefd83127a))
* **docs:** remove unwanted argument ([9f845c0](https://github.com/lensjs/lens/commit/9f845c09d5483bd5d633be41ace7bfb6135c3e09))
* drop emittery for commonjs issues ([6b632e3](https://github.com/lensjs/lens/commit/6b632e32f4bf52f0cb4e3178e314f080768f6e48))
* **express:** correct serving for static files ([76341e2](https://github.com/lensjs/lens/commit/76341e277e1f3ba60c43b10966d8a9de188ed5f7))
* **express:** fix express adapter test ([8cf4eb2](https://github.com/lensjs/lens/commit/8cf4eb20f92ea9d4add821fda82fad5e6bfc2f52))
* **fastify:** losing context between requests ([36235c2](https://github.com/lensjs/lens/commit/36235c20fcba40c9b94262d87ac05600bd71c9e9))
* fix types ([99df1f3](https://github.com/lensjs/lens/commit/99df1f37583316a7f873e4a1ff7da13a77f45aa0))
* fixing type error ([0bc241a](https://github.com/lensjs/lens/commit/0bc241ab56ae9f8d4315484fb8e42f70b0818c45))
* handle both __dirname and __filename undefined in getMeta function ([08cfc43](https://github.com/lensjs/lens/commit/08cfc43fb79c6b44d8a83b160c21fa48124c2797))
* **handlers:** incorrect normalizePayload parsing ([6387aeb](https://github.com/lensjs/lens/commit/6387aebe340ccdab1df93138115c44d4f1795bfb))
* isESM utility ([cd331c0](https://github.com/lensjs/lens/commit/cd331c0ca2b955857feb1ba654b4111de388dcd3))
* modify pnpm install command to avoid frozen lockfile ([37e58e4](https://github.com/lensjs/lens/commit/37e58e45c7f4225ae1ca400ce67c6f12f62178a9))
* **nestjs:** pass registerErrorHandler options when using fastify adapter ([f7d2028](https://github.com/lensjs/lens/commit/f7d20286c012571f1765536c76087211bc670365))
* parseBody in express adapter ([a68573e](https://github.com/lensjs/lens/commit/a68573eea6f2cff65ff670a19374778c4d3e6744))
* reorder @types/react-syntax-highlighter dependency in package.json ([a17b2a4](https://github.com/lensjs/lens/commit/a17b2a45831bbaac013499e2abf89af4354e6bff))
* **ui:** jsonViewer component ([49dc6f0](https://github.com/lensjs/lens/commit/49dc6f0bedacd95a290009ec02c241e0d0f3724a))
* update server port from 3000 to 3333 ([b42fefd](https://github.com/lensjs/lens/commit/b42fefd702c43e33b6334aa3d4d12370242c2742))


### Features

* **adapters:** accept requestId if exists in lensContext ([7cc419e](https://github.com/lensjs/lens/commit/7cc419e38766af8ea580bc63c1bd387750e377c3))
* **adapters:** integrate fastify adatper in nest adapter ([ab61cd3](https://github.com/lensjs/lens/commit/ab61cd3928ba822979094e7e6510e619986ce160))
* **adapters:** working on fastify adapter ([2acec62](https://github.com/lensjs/lens/commit/2acec6242cfd8278675cab9a072bef5eda9d8e16))
* **adapters:** working on nestjs adapter ([f6b4ab4](https://github.com/lensjs/lens/commit/f6b4ab4edba50457fba543355570ad2c6996ac17))
* **adapters:** working on nestjs adapter ([731adf3](https://github.com/lensjs/lens/commit/731adf3ab3d3983ecd01fd3b011936489e8fdd69))
* add cache watcher ([64887b2](https://github.com/lensjs/lens/commit/64887b25afb74d5a87ef74cfb97b5ae5b9993f78))
* add changelog-cli package ([c3c9a47](https://github.com/lensjs/lens/commit/c3c9a474910bb180106370d2b7fea6d26d824ade))
* add exception watcher ([1b97bdd](https://github.com/lensjs/lens/commit/1b97bdd0dcda98ca899ac2f1458e8fc2af2840ab))
* add getRequestIp to resolve custom client ip ([#37](https://github.com/lensjs/lens/issues/37)) ([92af02e](https://github.com/lensjs/lens/commit/92af02e5493be0810f58a5f5d1541b1a927a4721))
* add sqlite size-based pruning config ([4d3e4ef](https://github.com/lensjs/lens/commit/4d3e4efe0ebe5a71f4152923e86ebb6fa3911576))
* adding config in header ([04aeda5](https://github.com/lensjs/lens/commit/04aeda5d8f34a712bd5e985c3bab5e53a27cecc6))
* adding dart support ([f30e206](https://github.com/lensjs/lens/commit/f30e206a6ac7659ea01bf4090dc326f41dd9a032))
* adding more lang support and quicktype-core package ([17d9e62](https://github.com/lensjs/lens/commit/17d9e62f69091a844077df8cea987763db3f2b9e))
* adding search filter for requests ([e846424](https://github.com/lensjs/lens/commit/e846424916fa6551cd2918cda5749279ca6f29a6))
* adding ts type copy ([5acda34](https://github.com/lensjs/lens/commit/5acda349e8eb99d52072f53e82dbe656c5413a63))
* **adonis:** add queuedStore and hiddenParams configurations ([a5dde7c](https://github.com/lensjs/lens/commit/a5dde7cf491a64d4f9d74db0be45ed19b87c2595))
* **apps-fastify:** cache demo for testing ([30bfe29](https://github.com/lensjs/lens/commit/30bfe29762debf171dd6c7dbc36b2624061403ad))
* **apps-fastify:** cache demo for testing ([8b35a6b](https://github.com/lensjs/lens/commit/8b35a6b61467c72224831ba55ae2670bc9b7e2be))
* **apps-nestjs:** add cache, database demos ([51fc950](https://github.com/lensjs/lens/commit/51fc9500dfdcb53fcfdf9293ff695245d0b82a2a))
* **apps:** add nestjs query testing ([bac8db0](https://github.com/lensjs/lens/commit/bac8db077628f0698d55793e47fe183a01de5878))
* **core:** add queued store and hiden sensitive request data ([d3fd7f6](https://github.com/lensjs/lens/commit/d3fd7f60dddcba39f83617e916cd25ebbfa8b825))
* **docs:** adding docs for nestjs, fastify watchers ([f2d693b](https://github.com/lensjs/lens/commit/f2d693ba99e7ee249b05fd5c9c9b3aaf09de6b06))
* **docs:** update navigation bar ([7844d19](https://github.com/lensjs/lens/commit/7844d191ded6164c17f8a60f091f559150ba6fd6))
* handling exception columns ([0243630](https://github.com/lensjs/lens/commit/0243630d7254b7a38000fbcf96c9a64f350897a0))
* hide sensitive request data ([e3dbe2d](https://github.com/lensjs/lens/commit/e3dbe2d13bd4ea8f9badc9d75e5dc425e9276f94))
* implement StackTraceViewer and related components for enhanced error handling ([173d174](https://github.com/lensjs/lens/commit/173d174a5d77817ce1533ae91168277d69df4194))
* integrate exceptions watcher in adonis adapter ([67ed29b](https://github.com/lensjs/lens/commit/67ed29ba3f59d04a62f318082c5b833f916f8135))
* removing config for now ([cf16175](https://github.com/lensjs/lens/commit/cf161750ae25e41f3e027a02ddb2b25ec002a8e4))
* update .files ([7640be2](https://github.com/lensjs/lens/commit/7640be2360c84a7eaf9be4e6ff6cf1ab7fc08845))
* view exception details in the ui ([b327791](https://github.com/lensjs/lens/commit/b327791cf15bb9a30434a8564b6784ce6ddb0031))
* **watchers:** implementing cache watcher ([758ad75](https://github.com/lensjs/lens/commit/758ad750f8286fe0bccf68f0d9d75d30b15348f7))
* working on exception watcher ([02bb94d](https://github.com/lensjs/lens/commit/02bb94d6d9f9fd0f738699bb626b70666a591fdc))
* working on nestjs adapter ([876b2b4](https://github.com/lensjs/lens/commit/876b2b4ea25c4494f8da6920ecb280fff9d90462))


### Reverts

* Revert "Merge pull request #23 from lensjs/dependabot/npm_and_yarn/nestjs/cli-11.0.16" ([39cec50](https://github.com/lensjs/lens/commit/39cec500ab54d9daa957324f973859597c075072)), closes [#23](https://github.com/lensjs/lens/issues/23)
* **ui:** drop types component ([c1ce560](https://github.com/lensjs/lens/commit/c1ce56075b2f82b98b7cb663ec7907508fbd5d21))



## [1.0.1](https://github.com/lensjs/lens/compare/v1.0.2...1.0.1) (2025-08-28)



## [1.0.2](https://github.com/lensjs/lens/compare/v1.0.1...v1.0.2) (2025-08-28)



## [1.0.1](https://github.com/lensjs/lens/compare/v1.0.0...v1.0.1) (2025-08-28)



# [1.0.0](https://github.com/lensjs/lens/compare/c5f8bb263d85d7ab8be698dbabbaf1a564d45bf5...v1.0.0) (2025-08-28)


### Bug Fixes

* deps ([c5f8bb2](https://github.com/lensjs/lens/commit/c5f8bb263d85d7ab8be698dbabbaf1a564d45bf5))
* implement ignored, only paths logic ([55d9f76](https://github.com/lensjs/lens/commit/55d9f76c5e71ef2130042596a89ab524ddace258))
* logical bugs ([f7c1084](https://github.com/lensjs/lens/commit/f7c108426389633e71b4f567dc818fc1a99ddbf7))
* removing unused script ([4d1ecdc](https://github.com/lensjs/lens/commit/4d1ecdc0a2b97c12983d03b0515ba4b4da1ddd52))
* respect deps order ([0e5c56b](https://github.com/lensjs/lens/commit/0e5c56b06f37940a93ef4e793c5c28c2f6cfdb04))
* update lucide-react dependency version to ^0.541.0 ([9eb208e](https://github.com/lensjs/lens/commit/9eb208ee25e09921891b12edcadedc5e3d27807f))
* versions ([2fdf992](https://github.com/lensjs/lens/commit/2fdf992cb7012221136aeda0845a1c42d18d8561))


### Features

* add frameworks examples ([1a96977](https://github.com/lensjs/lens/commit/1a9697708ecdf2faf14ecc030db1e4bccd0eb63f))
* add script to copy front-end build files for different platforms ([ee6a586](https://github.com/lensjs/lens/commit/ee6a586aa2183f45ce3e6e760647d9310cacb2c8))
* **handlers:** support sequelize, kysely handlers ([2a08c44](https://github.com/lensjs/lens/commit/2a08c44d388d1651fe48656bf81d54f1cddf3ae2))
* make getUser dynamic ([93bb5ba](https://github.com/lensjs/lens/commit/93bb5ba6edae9a8a1cec285ba7f0bc96a315be7b))
* updates ([263dafc](https://github.com/lensjs/lens/commit/263dafc3da3231c7aeb3b6e0dc91837ddf8d6e0a))


### Reverts

* async context stuff ([ffa85b5](https://github.com/lensjs/lens/commit/ffa85b5afbd03d56ff19dede5c5c1e7c02208c31))
* event driven architecture ([38e60bc](https://github.com/lensjs/lens/commit/38e60bca05c42b0a6ffae772c51fe7663de3c463))



