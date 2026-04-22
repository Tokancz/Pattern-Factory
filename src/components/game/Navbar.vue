<template>
    <aside>
        <nav aria-label="Main navigation">
            <ul>
                <li><router-link to="/patterns">PATTERNS</router-link></li>
                <li><router-link to="/upgrades">UPGRADES</router-link></li>
                <li><router-link to="/synergies">SYNERGIES</router-link></li>
                <li><router-link to="/machines">MACHINES</router-link></li>
                <li><router-link to="/inventory">INVENTORY</router-link></li>
                <li><router-link to="/prestige">PRESTIGE</router-link></li>
                <li><router-link to="/leaderboard">RANKING</router-link></li>
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

    @media (width <= 1024px) {
      font-size: .9em;
    }

    nav {
      grid-area: nav;
      @include flexColumn(0, space-around);

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
        @include flexColumn(0, space-around);
      }

      li {
        width: 100%;
        height: 100%;

        @include flexRow(0, center, center);

        border-bottom: 2px solid var(--primary);
        border-top: 2px solid var(--primary);
        text-align: end;

        padding: 0 20px;
        cursor: pointer;
        user-select: none;
        transition: .3s;

        &:hover {
          background-color: var(--primary);
          color: var(--black);
        }
        &:hover a {
          color: var(--black);
        }
        a {
          display: block;
          width: 100%;
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