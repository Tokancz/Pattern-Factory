<template>
    <aside>
        <nav aria-label="Main navigation">
            <ul>
                <li><router-link to="/patterns">PATTERNS</router-link></li>
                <li><router-link to="/upgrades">PROTOCOLS</router-link></li>
                <li><router-link to="/synergies">RESONANCES</router-link></li>
                <li><router-link to="/machines">MODULES</router-link></li>
                <li><router-link to="/inventory">ARCHIVE</router-link></li>
                <li><router-link to="/glyphs">GLYPHS</router-link></li>
                <li><router-link to="/prestige">RECURSION</router-link></li>
                <li><router-link to="/achievements">MILESTONES</router-link></li>
                <li><router-link to="/leaderboard">REGISTRY</router-link></li>
            </ul>
        </nav>
      
        <img src="/img/Stripes.png" alt="Stripes Background" aria-hidden="true" draggable="false">
    </aside>
</template>

<style lang="scss">
  aside {
    grid-area: aside;

    display: grid;
    grid-template-rows: 6fr 3fr;
    grid-template-areas:
      "nav"
      "img";
    overflow: hidden;

    @include bp("lg") { font-size: .9em; }

    nav {
      grid-area: nav;
      @include flexColumn(0, space-around);

      ul {
        @include list-reset;
        @include flexColumn(0, space-around);
        width: 100%;
        height: 100%;
      }

      li {
        @include flexRow(0, end, center);
        width: 100%;
        height: 100%;
        border-bottom: 2px solid var(--primary);
        border-top: 2px solid var(--primary);
        text-align: end;
        padding-right: 10px;
        cursor: pointer;
        user-select: none;
        transition: .3s;

        &:hover {
          background-color: var(--primary);
          color: var(--black);

          a { color: var(--black); }
        }

        a {
          display: block;
          color: var(--primary);
          font-family: "ivy-presto";
          font-size: 4em;
          text-decoration: none;
          list-style: none;
        }
      }
    }

    img {
      height: 100%;
      user-select: none;
    }
  }
</style>